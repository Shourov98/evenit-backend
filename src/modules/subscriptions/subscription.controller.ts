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
