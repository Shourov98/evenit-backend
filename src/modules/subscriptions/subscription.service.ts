import Stripe from 'stripe';
import { AppError } from '../../common/errors/AppError';
import { env } from '../../config/env';
import { getStripe, hasStripeConfig } from '../../config/stripe';
import { hydrateUserSubscription, UserModel, UserRole } from '../auth/auth.model';

const subscriptionPaymentRoles = ['customer', 'service_provider', 'event_planner', 'venue_provider'] as const;
type SubscriptionPaymentRole = (typeof subscriptionPaymentRoles)[number];

const isSubscriptionPaymentRole = (role: UserRole): role is SubscriptionPaymentRole =>
  subscriptionPaymentRoles.includes(role as SubscriptionPaymentRole);

const ensureAllowedRole = (role: UserRole): void => {
  if (!isSubscriptionPaymentRole(role)) {
    throw new AppError(403, 'This role does not require subscription payment');
  }
};

export class SubscriptionService {
  private static async attachStripeReferences(params: {
    userId?: string;
    email?: string | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  }) {
    const user = await this.findUserForStripeEvent(params);

    ensureAllowedRole(user.role);

    user.subscription = {
      ...hydrateUserSubscription(user.role, user.subscription),
      stripeCustomerId: params.stripeCustomerId ?? user.subscription.stripeCustomerId,
      stripeSubscriptionId: params.stripeSubscriptionId ?? user.subscription.stripeSubscriptionId
    };

    await user.save();
    return user;
  }

  private static async findUserForStripeEvent(params: {
    userId?: string;
    email?: string | null;
    stripeCustomerId?: string | null;
  }) {
    if (params.userId) {
      const user = await UserModel.findById(params.userId);
      if (user) {
        return user;
      }
    }

    if (params.stripeCustomerId) {
      const user = await UserModel.findOne({
        'subscription.stripeCustomerId': params.stripeCustomerId
      });
      if (user) {
        return user;
      }
    }

    if (params.email) {
      const user = await UserModel.findOne({ email: params.email.toLowerCase() });
      if (user) {
        return user;
      }
    }

    throw new AppError(
      404,
      params.userId
        ? `User not found for Stripe client_reference_id ${params.userId}`
        : params.stripeCustomerId
          ? `User not found for Stripe customer ${params.stripeCustomerId}`
          : `User not found for Stripe customer email ${params.email || 'unknown'}`
    );
  }

  private static async markSubscriptionActive(params: {
    userId?: string;
    email?: string | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  }) {
    const user = await this.findUserForStripeEvent(params);

    ensureAllowedRole(user.role);

    user.subscription = {
      ...hydrateUserSubscription(user.role, user.subscription),
      status: 'subscribed',
      activatedAt: user.subscription.activatedAt ?? new Date(),
      stripeCustomerId: params.stripeCustomerId ?? user.subscription.stripeCustomerId,
      stripeSubscriptionId: params.stripeSubscriptionId ?? user.subscription.stripeSubscriptionId,
      payment: {
        ...hydrateUserSubscription(user.role, user.subscription).payment,
        status: 'paid',
        paidAt: new Date()
      }
    };

    await user.save();
    return user;
  }

  private static async markSubscriptionInactive(params: {
    stripeSubscriptionId?: string | null;
    stripeCustomerId?: string | null;
    email?: string | null;
  }) {
    const user =
      (params.stripeSubscriptionId
        ? await UserModel.findOne({
            'subscription.stripeSubscriptionId': params.stripeSubscriptionId
          })
        : null) ??
      (params.stripeCustomerId
        ? await UserModel.findOne({
            'subscription.stripeCustomerId': params.stripeCustomerId
          })
        : null) ??
      (params.email
        ? await UserModel.findOne({
            email: params.email.toLowerCase()
          })
        : null);

    if (!user) {
      return null;
    }

    user.subscription = {
      ...hydrateUserSubscription(user.role, user.subscription),
      status: 'not_subscribed',
      activatedAt: undefined,
      stripeCustomerId: params.stripeCustomerId ?? user.subscription.stripeCustomerId,
      stripeSubscriptionId: params.stripeSubscriptionId ?? user.subscription.stripeSubscriptionId,
      payment: {
        ...hydrateUserSubscription(user.role, user.subscription).payment,
        status: 'unpaid',
        paidAt: undefined
      }
    };

    await user.save();
    return user;
  }

  private static async syncSubscriptionFromStripeSubscription(subscription: Stripe.Subscription) {
    const stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : null;
    const status = subscription.status;

    if (['active', 'trialing'].includes(status)) {
      await this.markSubscriptionActive({
        stripeCustomerId,
        stripeSubscriptionId: subscription.id
      });
      return;
    }

    if (['past_due', 'unpaid', 'canceled', 'incomplete', 'incomplete_expired', 'paused'].includes(status)) {
      await this.markSubscriptionInactive({
        stripeSubscriptionId: subscription.id,
        stripeCustomerId
      });
    }
  }

  static async handleWebhookEvent(payload: Buffer, signature: string) {
    if (!hasStripeConfig()) {
      throw new AppError(500, 'Stripe is not configured');
    }

    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new AppError(500, 'Stripe webhook secret is not configured');
    }

    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') {
          return;
        }

        await this.attachStripeReferences({
          userId: session.client_reference_id ?? undefined,
          email: session.customer_details?.email ?? session.customer_email,
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
          stripeSubscriptionId:
            typeof session.subscription === 'string' ? session.subscription : null
        });
        return;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.resumed': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.syncSubscriptionFromStripeSubscription(subscription);
        return;
      }

      case 'customer.subscription.paused': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.markSubscriptionInactive({
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : null
        });
        return;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubscriptionId =
          typeof invoice.parent?.subscription_details?.subscription === 'string'
            ? invoice.parent.subscription_details.subscription
            : null;

        await this.markSubscriptionActive({
          email: typeof invoice.customer_email === 'string' ? invoice.customer_email : null,
          stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : null,
          stripeSubscriptionId
        });
        return;
      }

      case 'invoice.payment_action_required':
      case 'invoice.finalization_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubscriptionId =
          typeof invoice.parent?.subscription_details?.subscription === 'string'
            ? invoice.parent.subscription_details.subscription
            : null;

        await this.markSubscriptionInactive({
          stripeSubscriptionId,
          stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : null,
          email: typeof invoice.customer_email === 'string' ? invoice.customer_email : null
        });
        return;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubscriptionId =
          typeof invoice.parent?.subscription_details?.subscription === 'string'
            ? invoice.parent.subscription_details.subscription
            : null;

        await this.markSubscriptionInactive({
          stripeSubscriptionId,
          stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : null,
          email: typeof invoice.customer_email === 'string' ? invoice.customer_email : null
        });
        return;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.markSubscriptionInactive({
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: typeof subscription.customer === 'string' ? subscription.customer : null
        });
        return;
      }

      default:
        return;
    }
  }

  static async getHostedPaymentLink(userId: string, role: UserRole, email?: string | null) {
    ensureAllowedRole(role);
    const paymentRole = role as SubscriptionPaymentRole;

    const rolePaymentLinkMap: Record<SubscriptionPaymentRole, string> = {
      customer: env.CUSTOMER_SUBSCRIPTION_PAYMENT_LINK,
      service_provider: env.SERVICE_PROVIDER_SUBSCRIPTION_PAYMENT_LINK,
      event_planner: env.EVENT_PLANNER_SUBSCRIPTION_PAYMENT_LINK,
      venue_provider: env.VENUE_PROVIDER_SUBSCRIPTION_PAYMENT_LINK
    };

    const paymentLink = rolePaymentLinkMap[paymentRole];
    if (!paymentLink) {
      throw new AppError(500, `Subscription payment link is not configured for role ${paymentRole}`);
    }

    const checkoutUrl = new URL(paymentLink);
    checkoutUrl.searchParams.set('client_reference_id', userId);

    if (email) {
      checkoutUrl.searchParams.set('prefilled_email', email);
      checkoutUrl.searchParams.set('locked_prefilled_email', email);
    }

    return checkoutUrl.toString();
  }
}
