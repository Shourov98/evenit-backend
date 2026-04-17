import { Document, Model, Schema, Types, model, models } from 'mongoose';

export const BOOKING_TARGET_TYPES = ['venue', 'service', 'event'] as const;
export type BookingTargetType = (typeof BOOKING_TARGET_TYPES)[number];

export const BOOKING_STATUSES = ['pending', 'approved', 'rejected', 'confirmed', 'cancelled', 'completed'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = ['covered_by_subscription'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface IBooking extends Document {
  customerId: Types.ObjectId;
  providerId: Types.ObjectId;
  targetType: BookingTargetType;
  targetId: Types.ObjectId;
  reservedSlots: string[];
  bookingDate: string;
  hours: number[];
  guest_count?: number;
  durationHours: number;
  location?: string;
  specialInstructions?: string;
  pricing: {
    unitAmount: number;
    subtotal: number;
    taxAmount: number;
    platformFeeAmount: number;
    totalAmount: number;
    currency: string;
  };
  status: BookingStatus;
  payment: {
    status: PaymentStatus;
    coveredAt?: Date;
  };
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  cancelledAt?: Date;
  completedAt?: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
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
    reservedSlots: {
      type: [String],
      required: true,
      default: []
    },
    bookingDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true
    },
    hours: {
      type: [Number],
      required: true,
      validate: {
        validator(value: number[]) {
          return value.length > 0;
        },
        message: 'At least one hour is required'
      }
    },
    guest_count: {
      type: Number,
      min: 1
    },
    durationHours: {
      type: Number,
      required: true,
      min: 1
    },
    location: {
      type: String,
      trim: true,
      maxlength: 240
    },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: 2000
    },
    pricing: {
      unitAmount: { type: Number, required: true, min: 0 },
      subtotal: { type: Number, required: true, min: 0 },
      taxAmount: { type: Number, required: true, min: 0 },
      platformFeeAmount: { type: Number, required: true, min: 0 },
      totalAmount: { type: Number, required: true, min: 0 },
      currency: { type: String, required: true, uppercase: true, minlength: 3, maxlength: 3 }
    },
    status: {
      type: String,
      enum: BOOKING_STATUSES,
      default: 'pending',
      index: true
    },
    payment: {
      status: {
        type: String,
        enum: PAYMENT_STATUSES,
        default: 'covered_by_subscription'
      },
      coveredAt: {
        type: Date
      }
    },
    approvedAt: {
      type: Date
    },
    rejectedAt: {
      type: Date
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500
    },
    cancelledAt: {
      type: Date
    },
    completedAt: {
      type: Date
    }
  },
  { timestamps: true, versionKey: false }
);

bookingSchema.index({ customerId: 1, createdAt: -1 });
bookingSchema.index({ providerId: 1, createdAt: -1 });
bookingSchema.index({ targetType: 1, targetId: 1, bookingDate: 1 });
bookingSchema.index(
  { reservedSlots: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['pending', 'approved', 'confirmed'] }
    }
  }
);

export const BookingModel: Model<IBooking> =
  (models.Booking as Model<IBooking>) || model<IBooking>('Booking', bookingSchema);
