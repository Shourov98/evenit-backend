import { Request, Response } from 'express';
import { AppError } from '../../common/errors/AppError';
import { catchAsync } from '../../common/utils/catchAsync';
import { parsePagination } from '../../common/utils/pagination';
import { ReviewService } from './review.service';

const getUser = (req: Request) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }
  return req.user;
};

export class ReviewController {
  static createReview = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const result = await ReviewService.createReview(
      req.params.bookingId,
      user.userId,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: result
    });
  });

  static getReviewsByTarget = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const result = await ReviewService.getReviewsByTarget(
      req.params.targetId,
      pagination
    );

    return res.status(200).json({
      success: true,
      meta: result.meta,
      data: result.data
    });
  });

  static getReviewsByProvider = catchAsync(async (req: Request, res: Response) => {
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const result = await ReviewService.getReviewsByProvider(
      req.params.providerId,
      pagination
    );

    return res.status(200).json({
      success: true,
      meta: result.meta,
      data: result.data
    });
  });

  static getMyReviews = catchAsync(async (req: Request, res: Response) => {
    const user = getUser(req);
    const pagination = parsePagination(req.query as Record<string, unknown>);
    const result = await ReviewService.getMyReviews(user.userId, pagination);

    return res.status(200).json({
      success: true,
      meta: result.meta,
      data: result.data
    });
  });
}
