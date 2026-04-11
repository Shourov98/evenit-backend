import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { catchAsync } from '../../common/utils/catchAsync';
import { env } from '../../config/env';
import { SubscriptionService } from './subscription.service';

const getUserId = (req: Request): string => {
  if (!req.user?.userId) {
    throw new AppError(401, 'Authentication required: sign in before accessing subscription endpoints');
  }

  return req.user.userId;
};

export class SubscriptionController {
  static handleWebhook = async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'];

    if (typeof signature !== 'string' || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Stripe webhook signature header is missing'
      });
    }

    try {
      await SubscriptionService.handleWebhookEvent(req.body as Buffer, signature);

      return res.status(200).json({ received: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Stripe webhook processing failed';
      return res.status(400).json({
        success: false,
        message
      });
    }
  };

  static getPaymentLink = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const role = req.user?.role;

    const rolePaymentLinkMap = {
      customer: env.CUSTOMER_SUBSCRIPTION_PAYMENT_LINK,
      service_provider: env.SERVICE_PROVIDER_SUBSCRIPTION_PAYMENT_LINK,
      event_planner: env.EVENT_PLANNER_SUBSCRIPTION_PAYMENT_LINK,
      venue_provider: env.VENUE_PROVIDER_SUBSCRIPTION_PAYMENT_LINK
    } as const;

    if (!role || !(role in rolePaymentLinkMap)) {
      throw new AppError(403, 'This role does not require a subscription payment link');
    }

    const paymentLink = rolePaymentLinkMap[role as keyof typeof rolePaymentLinkMap];
    if (!paymentLink) {
      throw new AppError(500, `Subscription payment link is not configured for role ${role}`);
    }

    const checkoutUrl = new URL(paymentLink);
    checkoutUrl.searchParams.set('prefilled_email', req.user?.email ?? '');
    checkoutUrl.searchParams.set('locked_prefilled_email', req.user?.email ?? '');
    checkoutUrl.searchParams.set('client_reference_id', userId);

    return res.status(200).json({
      success: true,
      data: {
        userId,
        role,
        subscriptionStatus: req.user?.subscription.status ?? 'not_subscribed',
        isSubscribed: req.user?.subscription.status === 'subscribed',
        paymentLink: checkoutUrl.toString()
      }
    });
  });

  static getStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);

    return res.status(200).json({
      success: true,
      data: {
        userId,
        subscriptionStatus: req.user?.subscription.status ?? 'not_subscribed',
        isSubscribed: req.user?.subscription.status === 'subscribed'
      }
    });
  });

  static createPaymentIntent = catchAsync(async (req: Request, res: Response) => {
    const paymentIntent = await SubscriptionService.createPaymentIntent(getUserId(req), {
      paymentMethodId: req.body.paymentMethodId,
      confirm: req.body.confirm
    });

    return res.status(200).json({
      success: true,
      message: 'Subscription payment initiated successfully',
      data: paymentIntent
    });
  });

  static verifyPayment = catchAsync(async (req: Request, res: Response) => {
    const subscription = await SubscriptionService.verifyPayment(getUserId(req), req.body.paymentIntentId);

    return res.status(200).json({
      success: true,
      message: 'Subscription payment verified successfully',
      data: subscription
    });
  });
}
