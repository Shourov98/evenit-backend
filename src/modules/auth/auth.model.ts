import bcrypt from 'bcryptjs';
import { Document, Model, Schema, model, models } from 'mongoose';

export const USER_ROLES = [
  'super_admin',
  'admin',
  'service_provider',
  'event_provider',
  'venue_provider',
  'customer'
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const BUSINESS_TYPES = ['individual', 'company'] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const SERVICE_PROVIDER_TYPES = ['general_service', 'event_management'] as const;
export type ServiceProviderType = (typeof SERVICE_PROVIDER_TYPES)[number];

export interface IVerificationInfo {
  businessType: BusinessType;
  companyName?: string;
  nationalIdOrTradeLicenseUrl: string;
}

export interface IServiceProviderOnboarding {
  providerType: ServiceProviderType;
  serviceAreas: string[];
  yearsOfExperience?: number;
  teamSize?: number;
  specialties: string[];
  portfolioUrls: string[];
}

export interface IVenueProviderOnboarding {
  venueName: string;
  venueType: string;
  capacity: number;
  amenities: string[];
}

export interface IEventProviderOnboarding {
  organizationName: string;
  eventTypes: string[];
  teamSize?: number;
  pastEventsCount?: number;
  portfolioUrls: string[];
}

export interface IProviderOnboarding {
  verification: IVerificationInfo;
  stripeAccountId: string;
  businessAddress?: string;
  serviceProvider?: IServiceProviderOnboarding;
  eventProvider?: IEventProviderOnboarding;
  venueProvider?: IVenueProviderOnboarding;
  submittedAt: Date;
}

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  serviceCategories: string[];
  isEmailVerified: boolean;
  onboarding?: IProviderOnboarding;
  comparePassword(candidate: string): Promise<boolean>;
}

const verificationSchema = new Schema<IVerificationInfo>(
  {
    businessType: {
      type: String,
      enum: BUSINESS_TYPES,
      required: true
    },
    companyName: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    nationalIdOrTradeLicenseUrl: {
      type: String,
      required: true,
      trim: true
    }
  },
  { _id: false }
);

const serviceProviderOnboardingSchema = new Schema<IServiceProviderOnboarding>(
  {
    providerType: {
      type: String,
      enum: SERVICE_PROVIDER_TYPES,
      required: true
    },
    serviceAreas: {
      type: [String],
      required: true,
      default: []
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      max: 80
    },
    teamSize: {
      type: Number,
      min: 1
    },
    specialties: {
      type: [String],
      default: []
    },
    portfolioUrls: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const venueProviderOnboardingSchema = new Schema<IVenueProviderOnboarding>(
  {
    venueName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    venueType: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    amenities: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const eventProviderOnboardingSchema = new Schema<IEventProviderOnboarding>(
  {
    organizationName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    eventTypes: {
      type: [String],
      required: true,
      default: []
    },
    teamSize: {
      type: Number,
      min: 1
    },
    pastEventsCount: {
      type: Number,
      min: 0
    },
    portfolioUrls: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const providerOnboardingSchema = new Schema<IProviderOnboarding>(
  {
    verification: {
      type: verificationSchema,
      required: true
    },
    stripeAccountId: {
      type: String,
      required: true,
      trim: true
    },
    businessAddress: {
      type: String,
      trim: true,
      maxlength: 240
    },
    serviceProvider: {
      type: serviceProviderOnboardingSchema
    },
    eventProvider: {
      type: eventProviderOnboardingSchema
    },
    venueProvider: {
      type: venueProviderOnboardingSchema
    },
    submittedAt: {
      type: Date,
      required: true
    }
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 80
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'customer'
    },
    serviceCategories: {
      type: [String],
      default: []
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    onboarding: {
      type: providerOnboardingSchema
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

export const UserModel: Model<IUser> =
  (models.User as Model<IUser>) || model<IUser>('User', userSchema);
