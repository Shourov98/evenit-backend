import { Document, Model, Schema, Types, model, models } from 'mongoose';

const VENUE_AVAILABILITY_STATUSES = ['available', 'pending', 'booked'] as const;
export type VenueAvailabilityStatus = (typeof VENUE_AVAILABILITY_STATUSES)[number];

const DISCOUNT_TYPES = ['percentage', 'fixed'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export interface IAvailabilityOverride {
  date: string;
  status: VenueAvailabilityStatus;
}

export interface IVenue extends Document {
  ownerId: Types.ObjectId;
  information: {
    venueName: string;
    venueType: string;
    description?: string;
    addressLine: string;
    city: string;
    area?: string;
  };
  pricing: {
    basePrice: number;
    currency: string;
    discount?: {
      type: DiscountType;
      value: number;
    };
    amenities: Record<string, boolean>;
  };
  capacity: {
    maximumGuests: number;
  };
  media: {
    galleryImages: string[];
    videoUrl?: string;
  };
  availabilityOverrides: IAvailabilityOverride[];
  isDeleted: boolean;
}

const availabilityOverrideSchema = new Schema<IAvailabilityOverride>(
  {
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    status: {
      type: String,
      enum: VENUE_AVAILABILITY_STATUSES,
      required: true
    }
  },
  { _id: false }
);

const venueSchema = new Schema<IVenue>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    information: {
      venueName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
      venueType: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
      description: { type: String, trim: true, maxlength: 2000 },
      addressLine: { type: String, required: true, trim: true, minlength: 3, maxlength: 240 },
      city: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
      area: { type: String, trim: true, maxlength: 80 }
    },
    pricing: {
      basePrice: { type: Number, required: true, min: 0 },
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
      },
      amenities: {
        type: Map,
        of: Boolean,
        default: {}
      }
    },
    capacity: {
      maximumGuests: { type: Number, required: true, min: 1 }
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
      type: [availabilityOverrideSchema],
      default: []
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  { timestamps: true, versionKey: false }
);

venueSchema.index({ ownerId: 1, createdAt: -1 });

export const VenueProviderVenueModel: Model<IVenue> =
  (models.VenueProviderVenue as Model<IVenue>) || model<IVenue>('VenueProviderVenue', venueSchema);

