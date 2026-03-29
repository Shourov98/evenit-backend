import { AppError } from '../../common/errors/AppError';
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

  return Math.round(amount * 100);
};

export class SubscriptionService {
  static async createPaymentIntent(userId: string) {
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
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: user.subscription.payment.currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true
      },
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
