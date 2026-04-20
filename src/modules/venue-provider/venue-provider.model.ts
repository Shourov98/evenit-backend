import { Document, Model, Schema, Types, model, models } from 'mongoose';
import { AvailabilityEntry } from '../../common/utils/availability';

const DISCOUNT_TYPES = ['percentage', 'fixed'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];
export const VENUE_AMENITY_KEYS = [
  'wifi',
  'parking',
  'ac',
  'catering',
  'audioVideo',
  'security',
  'accessible',
  'soundSystem'
] as const;
export type VenueAmenityKey = (typeof VENUE_AMENITY_KEYS)[number];

export const DEFAULT_VENUE_AMENITIES: Record<VenueAmenityKey, boolean> = {
  wifi: false,
  parking: false,
  ac: false,
  catering: false,
  audioVideo: false,
  security: false,
  accessible: false,
  soundSystem: false
};

export const normalizeVenueAmenities = (value?: unknown): Record<VenueAmenityKey, boolean> => {
  const source =
    value instanceof Map ? Object.fromEntries(value.entries()) : value && typeof value === 'object' ? value : {};

  return {
    wifi: Boolean((source as Record<string, unknown>).wifi),
    parking: Boolean((source as Record<string, unknown>).parking),
    ac: Boolean((source as Record<string, unknown>).ac),
    catering: Boolean((source as Record<string, unknown>).catering),
    audioVideo: Boolean((source as Record<string, unknown>).audioVideo),
    security: Boolean((source as Record<string, unknown>).security),
    accessible: Boolean((source as Record<string, unknown>).accessible),
    soundSystem: Boolean((source as Record<string, unknown>).soundSystem)
  };
};

export interface IVenueReview {
  reviewerName: string;
  reviewerAvatarUrl?: string;
  rating: number;
  comment: string;
  createdAt: Date;
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
  availabilityCalendar: AvailabilityEntry[];
  publishStatus: 'pending' | 'published' | 'rejected';
  approvedBy?: {
    name: string;
    email: string;
  };
  approvedAt?: Date;
  reviews: IVenueReview[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const availabilityEntrySchema = new Schema<AvailabilityEntry>(
  {
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/
    },
    hours: {
      type: [Number],
      default: []
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
    availabilityCalendar: {
      type: [availabilityEntrySchema],
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
    reviews: {
      type: [
        {
          reviewerName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
          reviewerAvatarUrl: { type: String, trim: true },
          rating: { type: Number, required: true, min: 1, max: 5 },
          comment: { type: String, required: true, trim: true, minlength: 2, maxlength: 2000 },
          createdAt: { type: Date, default: Date.now }
        }
      ],
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
