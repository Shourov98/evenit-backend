import Stripe from 'stripe';
import { AppError } from '../../common/errors/AppError';
import { env } from '../../config/env';
import { getStripe, hasStripeConfig } from '../../config/stripe';
import { hydrateUserSubscription, UserModel, UserRole } from '../auth/auth.model';

const subscriptionPaymentRoles: UserRole[] = ['customer', 'service_provider', 'event_planner', 'venue_provider'];

const ensureAllowedRole = (role: UserRole): void => {
  if (!subscriptionPaymentRoles.includes(role)) {
    throw new AppError(403, 'This role does not require subscription payment');
  }
};

const toStripeAmount = (amount: number): number => {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new AppError(400, 'Invalid subscription amount');
  }

  return Math.round(amount);
};

export class SubscriptionService {
  private static async markSubscriptionActive(params: {
    userId?: string;
    email?: string | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  }) {
    const user = params.userId
      ? await UserModel.findById(params.userId)
      : await UserModel.findOne({ email: params.email?.toLowerCase() });

    if (!user) {
      throw new AppError(
        404,
        params.userId
          ? `User not found for Stripe client_reference_id ${params.userId}`
          : `User not found for Stripe customer email ${params.email || 'unknown'}`
      );
    }

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

  private static async markSubscriptionInactiveByStripeSubscriptionId(stripeSubscriptionId: string) {
    const user = await UserModel.findOne({
      'subscription.stripeSubscriptionId': stripeSubscriptionId
    });

    if (!user) {
      return;
    }

    user.subscription = {
      ...hydrateUserSubscription(user.role, user.subscription),
      status: 'not_subscribed',
      activatedAt: undefined,
      stripeCustomerId: user.subscription.stripeCustomerId,
      stripeSubscriptionId,
      payment: {
        ...hydrateUserSubscription(user.role, user.subscription).payment,
        status: 'unpaid',
        paidAt: undefined
      }
    };

    await user.save();
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

        await this.markSubscriptionActive({
          userId: session.client_reference_id ?? undefined,
          email: session.customer_details?.email ?? session.customer_email,
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
          stripeSubscriptionId:
            typeof session.subscription === 'string' ? session.subscription : null
        });
        return;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubscriptionId =
          typeof invoice.parent?.subscription_details?.subscription === 'string'
            ? invoice.parent.subscription_details.subscription
            : null;

        const customerEmail =
          typeof invoice.customer_email === 'string'
            ? invoice.customer_email
            : null;

        await this.markSubscriptionActive({
          email: customerEmail,
          stripeCustomerId: typeof invoice.customer === 'string' ? invoice.customer : null,
          stripeSubscriptionId
        });
        return;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.markSubscriptionInactiveByStripeSubscriptionId(subscription.id);
        return;
      }

      default:
        return;
    }
  }

  static async createPaymentIntent(
    userId: string,
    options?: {
      paymentMethodId?: string;
      confirm?: boolean;
    }
  ) {
    if (!hasStripeConfig()) {
      throw new AppError(500, 'Stripe is not configured');
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    ensureAllowedRole(user.role);

    const hydratedSubscription = hydrateUserSubscription(user.role, user.subscription);
    if (JSON.stringify(user.subscription) !== JSON.stringify(hydratedSubscription)) {
      user.subscription = hydratedSubscription;
      await user.save();
    }

    if (user.subscription.status === 'subscribed') {
      throw new AppError(400, 'Subscription is already active');
    }

    const amount = toStripeAmount(user.subscription.payment.amount);
    if (amount <= 0) {
      throw new AppError(400, 'This subscription does not require online payment');
    }

    const stripe = getStripe();
    const shouldConfirm = Boolean(options?.confirm);
    if (shouldConfirm && !options?.paymentMethodId) {
      throw new AppError(400, 'paymentMethodId is required when confirm is true');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: user.subscription.payment.currency.toLowerCase(),
      ...(options?.paymentMethodId ? { payment_method: options.paymentMethodId } : {}),
      ...(shouldConfirm
        ? {
            confirm: true,
            automatic_payment_methods: {
              enabled: true,
              allow_redirects: 'never' as const
            }
          }
        : {
            automatic_payment_methods: {
              enabled: true
            }
          }),
      metadata: {
        userId: String(user._id),
        role: user.role,
        plan: user.subscription.plan,
        billingCycle: user.subscription.payment.billingCycle
      }
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentStatus: paymentIntent.status,
      amount: user.subscription.payment.amount,
      currency: user.subscription.payment.currency,
      plan: user.subscription.plan,
      billingCycle: user.subscription.payment.billingCycle
    };
  }

  static async verifyPayment(userId: string, paymentIntentId: string) {
    if (!hasStripeConfig()) {
      throw new AppError(500, 'Stripe is not configured');
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    ensureAllowedRole(user.role);

    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata.userId !== String(user._id)) {
      throw new AppError(403, 'Payment does not belong to the authenticated user');
    }

    if (paymentIntent.status !== 'succeeded') {
      throw new AppError(400, `PaymentIntent is ${paymentIntent.status}, not succeeded`);
    }

    user.subscription = {
      ...hydrateUserSubscription(user.role, user.subscription),
      status: 'subscribed',
      activatedAt: new Date(),
      stripeCustomerId: user.subscription.stripeCustomerId,
      stripeSubscriptionId: user.subscription.stripeSubscriptionId,
      payment: {
        ...hydrateUserSubscription(user.role, user.subscription).payment,
        status: 'paid',
        paidAt: new Date()
      }
    };

    await user.save();

    return user.subscription;
  }
}
