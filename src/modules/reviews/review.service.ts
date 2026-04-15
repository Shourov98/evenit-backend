import { isValidObjectId } from 'mongoose';
import { AppError } from '../../common/errors/AppError';
import { buildPaginationMeta, PaginationOptions } from '../../common/utils/pagination';
import { BookingModel } from '../bookings/booking.model';
import { ReviewModel } from './review.model';

const ensureObjectId = (value: string, label: string): void => {
  if (!isValidObjectId(value)) {
    throw new AppError(400, `Invalid ${label}`);
  }
};

export class ReviewService {
  static async createReview(
    bookingId: string,
    customerId: string,
    payload: { rating: number; comment: string }
  ) {
    ensureObjectId(bookingId, 'bookingId');
    ensureObjectId(customerId, 'customerId');

    const booking = await BookingModel.findById(bookingId);
    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (String(booking.customerId) !== customerId) {
      throw new AppError(403, 'Only the customer of this booking can leave a review');
    }

    if (booking.status !== 'completed') {
      throw new AppError(400, 'Cannot review an incomplete booking');
    }

    const existingReview = await ReviewModel.findOne({ bookingId });
    if (existingReview) {
      throw new AppError(409, 'A review for this booking already exists');
    }

    const review = await ReviewModel.create({
      bookingId: booking._id,
      customerId: booking.customerId,
      providerId: booking.providerId,
      targetType: booking.targetType,
      targetId: booking.targetId,
      rating: payload.rating,
      comment: payload.comment
    });

    return review;
  }

  static async getReviewsByTarget(targetId: string, pagination: PaginationOptions) {
    ensureObjectId(targetId, 'targetId');

    const filter = { targetId };
    const [reviews, total] = await Promise.all([
      ReviewModel.find(filter)
        .sort({ [pagination.sortBy]: pagination.sortOrder })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate<{ customerId: any }>('customerId', 'fullName profileImage'),
      ReviewModel.countDocuments(filter)
    ]);

    return {
      meta: buildPaginationMeta(total, pagination),
      data: reviews
    };
  }

  static async getReviewsByProvider(providerId: string, pagination: PaginationOptions) {
    ensureObjectId(providerId, 'providerId');

    const filter = { providerId };
    const [reviews, total] = await Promise.all([
      ReviewModel.find(filter)
        .sort({ [pagination.sortBy]: pagination.sortOrder })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate<{ customerId: any }>('customerId', 'fullName profileImage'),
      ReviewModel.countDocuments(filter)
    ]);

    return {
      meta: buildPaginationMeta(total, pagination),
      data: reviews
    };
  }

  static async getMyReviews(customerId: string, pagination: PaginationOptions) {
    ensureObjectId(customerId, 'customerId');

    const filter = { customerId };
    const [reviews, total] = await Promise.all([
      ReviewModel.find(filter)
        .sort({ [pagination.sortBy]: pagination.sortOrder })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .populate<{ providerId: any }>('providerId', 'fullName profileImage'),
      ReviewModel.countDocuments(filter)
    ]);

    return {
      meta: buildPaginationMeta(total, pagination),
      data: reviews
    };
  }
}
