import { Document, Model, Schema, Types, model, models } from 'mongoose';
import { BookingTargetType, BOOKING_TARGET_TYPES } from '../bookings/booking.model';

export interface IReview extends Document {
  bookingId: Types.ObjectId;
  customerId: Types.ObjectId;
  providerId: Types.ObjectId;
  targetType: BookingTargetType;
  targetId: Types.ObjectId;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true,
      index: true
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    providerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: BOOKING_TARGET_TYPES,
      required: true,
      index: true
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 2000
    }
  },
  { timestamps: true, versionKey: false }
);

reviewSchema.index({ targetId: 1, createdAt: -1 });
reviewSchema.index({ providerId: 1, createdAt: -1 });
reviewSchema.index({ customerId: 1, createdAt: -1 });

export const ReviewModel: Model<IReview> =
  (models.Review as Model<IReview>) || model<IReview>('Review', reviewSchema);
