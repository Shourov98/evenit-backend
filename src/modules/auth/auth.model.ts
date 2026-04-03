import bcrypt from 'bcryptjs';
import { Document, Model, Schema, model, models } from 'mongoose';

export const USER_ROLES = [
  'super_admin',
  'admin',
  'service_provider',
  'event_planner',
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

export interface IServiceProviderVerificationInfo {
  businessType: BusinessType;
  companyName?: string;
  nationalIdOrTradeLicenseFiles: string[];
}

export interface IServiceProviderProfileInfo {
  serviceName: string;
  serviceCategory: string;
  serviceDescription?: string;
  coverageArea: string[];
  verification: IServiceProviderVerificationInfo;
}

export interface IServiceProviderOnboarding {
  _id: string;
  name: string;
  email: string;
  profileInfo: IServiceProviderProfileInfo;
  services: string[];
}

export interface IVenueProviderOnboarding {
  _id: string;
  fullName: string;
  email: string;
  stripeAccountId?: string;
  businessName: string;
  businessType: BusinessType;
  legalBusinessName?: string;
  registrationNo?: string;
  businessMail: string;
  businessPhoneNo: string;
}

export interface IEventProviderOnboarding {
  _id: string;
  fullName: string;
  email: string;
  profileInfo: {
    name: string;
    description?: string;
    coverageArea: string[];
    address: string;
    verification: IServiceProviderVerificationInfo;
  };
}

export interface IProviderOnboarding {
  verification: IVerificationInfo;
  stripeAccountId?: string;
  businessAddress?: string;
  serviceProvider?: IServiceProviderOnboarding;
  eventProvider?: IEventProviderOnboarding;
  venueProvider?: IVenueProviderOnboarding;
  submittedAt: Date;
}

export const SUBSCRIPTION_STATUSES = ['subscribed', 'not_subscribed'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_PLANS = [
  'customer_plan',
  'event_planner_plan',
  'service_provider_plan',
  'venue_provider_plan',
  'admin_plan',
  'super_admin_plan'
] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const SUBSCRIPTION_PAYMENT_STATUSES = ['paid', 'unpaid'] as const;
export type SubscriptionPaymentStatus = (typeof SUBSCRIPTION_PAYMENT_STATUSES)[number];

export const SUBSCRIPTION_BILLING_CYCLES = ['monthly', 'yearly'] as const;
export type SubscriptionBillingCycle = (typeof SUBSCRIPTION_BILLING_CYCLES)[number];

export interface IUserSubscriptionPayment {
  amount: number;
  currency: string;
  billingCycle: SubscriptionBillingCycle;
  status: SubscriptionPaymentStatus;
  paidAt?: Date;
}

export interface IUserSubscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  activatedAt?: Date;
  payment: IUserSubscriptionPayment;
}

export interface IUserProfileImage {
  url: string;
  publicId: string;
}

export interface IUserSubscriptionInput
  extends Partial<Omit<IUserSubscription, 'payment'>> {
  payment?: Partial<IUserSubscriptionPayment>;
}

export const DEFAULT_SUBSCRIPTION_PLANS: Record<UserRole, SubscriptionPlan> = {
  customer: 'customer_plan',
  event_planner: 'event_planner_plan',
  service_provider: 'service_provider_plan',
  venue_provider: 'venue_provider_plan',
  admin: 'admin_plan',
  super_admin: 'super_admin_plan'
};

export const DEFAULT_SUBSCRIPTION_PAYMENTS: Record<
  UserRole,
  Pick<IUserSubscriptionPayment, 'amount' | 'currency' | 'billingCycle'>
> = {
  customer: { amount: 500, currency: 'GBP', billingCycle: 'monthly' },
  event_planner: { amount: 2000, currency: 'GBP', billingCycle: 'monthly' },
  service_provider: { amount: 500, currency: 'GBP', billingCycle: 'monthly' },
  venue_provider: { amount: 50000, currency: 'GBP', billingCycle: 'yearly' },
  admin: { amount: 0, currency: 'GBP', billingCycle: 'monthly' },
  super_admin: { amount: 0, currency: 'GBP', billingCycle: 'monthly' }
};

export const createDefaultUserSubscription = (role: UserRole): IUserSubscription => ({
  plan: DEFAULT_SUBSCRIPTION_PLANS[role],
  status: 'not_subscribed',
  payment: {
    ...DEFAULT_SUBSCRIPTION_PAYMENTS[role],
    status: 'unpaid'
  }
});

export const hydrateUserSubscription = (
  role: UserRole,
  subscription?: IUserSubscriptionInput | null
): IUserSubscription => {
  const defaults = createDefaultUserSubscription(role);
  const payment = {
    ...defaults.payment,
    status: subscription?.payment?.status ?? defaults.payment.status,
    paidAt: subscription?.payment?.paidAt
  };

  return {
    ...defaults,
    status: subscription?.status ?? defaults.status,
    activatedAt: subscription?.activatedAt,
    payment
  };
};

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  role: UserRole;
  serviceCategories: string[];
  isEmailVerified: boolean;
  isBlocked: boolean;
  subscription: IUserSubscription;
  profileImage?: IUserProfileImage;
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
    _id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    profileInfo: {
      serviceName: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 120
      },
      serviceCategory: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 80
      },
      serviceDescription: {
        type: String,
        trim: true,
        maxlength: 2000
      },
      coverageArea: {
        type: [String],
        required: true,
        default: []
      },
      verification: {
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
        nationalIdOrTradeLicenseFiles: {
          type: [String],
          required: true,
          default: []
        }
      }
    },
    services: {
      type: [String],
      default: []
    }
  },
  { _id: false }
);

const venueProviderOnboardingSchema = new Schema<IVenueProviderOnboarding>(
  {
    _id: {
      type: String,
      required: true
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    stripeAccountId: {
      type: String,
      trim: true
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    businessType: {
      type: String,
      required: true,
      enum: BUSINESS_TYPES
    },
    legalBusinessName: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    registrationNo: {
      type: String,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    businessMail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    businessPhoneNo: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 30
    }
  },
  { _id: false }
);

const eventProviderOnboardingSchema = new Schema<IEventProviderOnboarding>(
  {
    _id: {
      required: true,
      type: String
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    profileInfo: {
      name: {
        type: String,
        required: true,
        trim: true,
        minlength: 2,
        maxlength: 120
      },
      description: {
        type: String,
        trim: true,
        maxlength: 2000
      },
      coverageArea: {
        type: [String],
        required: true,
        default: []
      },
      address: {
        type: String,
        required: true,
        trim: true,
        minlength: 3,
        maxlength: 240
      },
      verification: {
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
        nationalIdOrTradeLicenseFiles: {
          type: [String],
          required: true,
          default: []
        }
      }
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

const userSubscriptionSchema = new Schema<IUserSubscription>(
  {
    plan: {
      type: String,
      enum: SUBSCRIPTION_PLANS,
      required: true
    },
    status: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      required: true,
      default: 'not_subscribed'
    },
    activatedAt: {
      type: Date
    },
    payment: {
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      currency: {
        type: String,
        required: true,
        uppercase: true,
        minlength: 3,
        maxlength: 3
      },
      billingCycle: {
        type: String,
        enum: SUBSCRIPTION_BILLING_CYCLES,
        required: true
      },
      status: {
        type: String,
        enum: SUBSCRIPTION_PAYMENT_STATUSES,
        required: true
      },
      paidAt: {
        type: Date
      }
    }
  },
  { _id: false }
);

const userProfileImageSchema = new Schema<IUserProfileImage>(
  {
    url: {
      type: String,
      required: true,
      trim: true
    },
    publicId: {
      type: String,
      required: true,
      trim: true
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
    isBlocked: {
      type: Boolean,
      default: false,
      index: true
    },
    subscription: {
      type: userSubscriptionSchema,
      required: true,
      default: function defaultSubscription(this: IUser) {
        return createDefaultUserSubscription(this.role ?? 'customer');
      }
    },
    profileImage: {
      type: userProfileImageSchema
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
