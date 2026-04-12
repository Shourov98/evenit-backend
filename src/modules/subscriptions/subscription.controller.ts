import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { catchAsync } from '../../common/utils/catchAsync';
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
      const isSignatureError =
        error instanceof Error &&
        /signature|webhook/i.test(error.message);

      return res.status(isSignatureError ? 400 : 500).json({
        success: false,
        message
      });
    }
  };

  static createSubscription = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const role = req.user?.role;

    if (!role || !['customer', 'service_provider', 'event_planner', 'venue_provider'].includes(role)) {
      throw new AppError(403, 'This role does not require a subscription');
    }

    const result = await SubscriptionService.createSubscriptionForPaymentElement({
      userId,
      role,
      email: req.user?.email ?? null,
      fullName: req.user?.fullName ?? null
    });

    return res.status(200).json({
      success: true,
      data: result
    });
  });

  static getPaymentLink = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const role = req.user?.role;
    const isSubscribed = req.user?.subscription.status === 'subscribed';
    if (!role || !['customer', 'service_provider', 'event_planner', 'venue_provider'].includes(role)) {
      throw new AppError(403, 'This role does not require a subscription payment link');
    }

    if (isSubscribed) {
      throw new AppError(400, 'Subscription is already active');
    }

    const paymentLink = await SubscriptionService.getHostedPaymentLink(userId, role, req.user?.email);

    return res.status(200).json({
      success: true,
      data: {
        userId,
        role,
        subscriptionStatus: req.user?.subscription.status ?? 'not_subscribed',
        isSubscribed,
        paymentLink
      }
    });
  });

  static stopRecurring = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const result = await SubscriptionService.stopRecurringAtPeriodEnd(userId);

    return res.status(200).json({
      success: true,
      message: 'Recurring subscription will stop at the end of the current billing period',
      data: result
    });
  });

  static resumeRecurring = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const result = await SubscriptionService.resumeRecurring(userId);

    return res.status(200).json({
      success: true,
      message: 'Recurring subscription has been restarted',
      data: result
    });
  });

  static getStatus = catchAsync(async (req: Request, res: Response) => {
    const userId = getUserId(req);
    const state = await SubscriptionService.getSubscriptionManagementState(userId);

    return res.status(200).json({
      success: true,
      data: {
        userId,
        ...state
      }
    });
  });
}
