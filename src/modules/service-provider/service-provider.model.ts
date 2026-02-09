import { Document, Model, Schema, Types, model, models } from 'mongoose';

const SERVICE_AVAILABILITY_STATUSES = ['available', 'pending', 'booked'] as const;
export type ServiceAvailabilityStatus = (typeof SERVICE_AVAILABILITY_STATUSES)[number];

const DISCOUNT_TYPES = ['percentage', 'fixed'] as const;
export type ServiceDiscountType = (typeof DISCOUNT_TYPES)[number];

const PRICING_TYPES = ['fixed', 'hourly', 'daily', 'package'] as const;
export type ServicePricingType = (typeof PRICING_TYPES)[number];

export interface IServiceAvailabilityOverride {
  date: string;
  status: ServiceAvailabilityStatus;
}

export interface IServiceProviderService extends Document {
  ownerId: Types.ObjectId;
  information: {
    serviceName: string;
    category: string;
    description?: string;
    serviceArea: string[];
    tags: string[];
  };
  pricing: {
    amount: number;
    pricingType: ServicePricingType;
    currency: string;
    discount?: {
      type: ServiceDiscountType;
      value: number;
    };
  };
  settings: {
    amenities: Record<string, boolean>;
    capacity?: number;
  };
  media: {
    galleryImages: string[];
    videoUrl?: string;
  };
  availabilityOverrides: IServiceAvailabilityOverride[];
  publishStatus: 'pending' | 'published' | 'rejected';
  approvedBy?: {
    name: string;
    email: string;
  };
  approvedAt?: Date;
  isDeleted: boolean;
}

const serviceAvailabilityOverrideSchema = new Schema<IServiceAvailabilityOverride>(
  {
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    status: {
      type: String,
      enum: SERVICE_AVAILABILITY_STATUSES,
      required: true
    }
  },
  { _id: false }
);

const serviceProviderServiceSchema = new Schema<IServiceProviderService>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    information: {
      serviceName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
      category: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
      description: { type: String, trim: true, maxlength: 2000 },
      serviceArea: { type: [String], required: true, default: [] },
      tags: { type: [String], default: [] }
    },
    pricing: {
      amount: { type: Number, required: true, min: 0 },
      pricingType: { type: String, enum: PRICING_TYPES, required: true, default: 'fixed' },
      currency: { type: String, required: true, default: 'BDT', uppercase: true, minlength: 3, maxlength: 3 },
      discount: {
        type: {
          type: String,
          enum: DISCOUNT_TYPES
        },
        value: {
          type: Number,
          min: 0
        }
      }
    },
    settings: {
      amenities: {
        type: Map,
        of: Boolean,
        default: {}
      },
      capacity: { type: Number, min: 1 }
    },
    media: {
      galleryImages: {
        type: [String],
        default: [],
        validate: {
          validator(value: string[]) {
            return value.length <= 10;
          },
          message: 'galleryImages can contain at most 10 images'
        }
      },
      videoUrl: { type: String, trim: true }
    },
    availabilityOverrides: {
      type: [serviceAvailabilityOverrideSchema],
      default: []
    },
    publishStatus: {
      type: String,
      enum: ['pending', 'published', 'rejected'],
      default: 'pending',
      index: true
    },
    approvedBy: {
      name: { type: String, trim: true },
      email: { type: String, trim: true, lowercase: true }
    },
    approvedAt: {
      type: Date
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true, versionKey: false }
);

serviceProviderServiceSchema.index({ ownerId: 1, createdAt: -1 });

export const ServiceProviderServiceModel: Model<IServiceProviderService> =
  (models.ServiceProviderService as Model<IServiceProviderService>) ||
  model<IServiceProviderService>('ServiceProviderService', serviceProviderServiceSchema);
