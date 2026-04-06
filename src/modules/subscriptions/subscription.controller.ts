import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { catchAsync } from '../../common/utils/catchAsync';
import { SubscriptionService } from './subscription.service';

const getUserId = (req: Request): string => {
  if (!req.user?.userId) {
    throw new AppError(401, 'Unauthorized');
  }

  return req.user.userId;
};

export class SubscriptionController {
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
