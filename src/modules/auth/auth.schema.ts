import { z } from 'zod';

const fullNameRule = z
  .string()
  .min(3)
  .max(80)
  .refine((value) => value.trim().split(/\s+/).length >= 2, {
    message: 'fullName must include at least first name and last name'
  });

const signupRoles = ['customer', 'service_provider', 'event_provider', 'venue_provider'] as const;

export const registerSchema = z
  .object({
    body: z
      .object({
        fullName: fullNameRule,
        email: z.string().email(),
        password: z.string().min(8).max(64),
        role: z.enum(signupRoles).default('customer'),
        serviceCategories: z.array(z.string().min(1)).max(20).optional().default([])
      })
      .superRefine((data, ctx) => {
        if (data.role === 'service_provider' && data.serviceCategories.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['serviceCategories'],
            message: 'serviceCategories is required for service_provider role'
          });
        }
      }),
    params: z.object({}).optional().default({}),
    query: z.object({}).optional().default({})
  })
  .strict();

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(64)
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

export const verifyEmailOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits')
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

export const resendVerificationOtpSchema = z.object({
  body: z.object({
    email: z.string().email()
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

export const forgotPasswordRequestSchema = z.object({
  body: z.object({
    email: z.string().email()
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
    newPassword: z.string().min(8).max(64)
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

const verificationSchema = z
  .object({
    businessType: z.enum(['individual', 'company']),
    companyName: z.string().min(2).max(120).optional(),
    nationalIdOrTradeLicenseUrl: z.string().url()
  })
  .superRefine((data, ctx) => {
    if (data.businessType === 'company' && !data.companyName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyName'],
        message: 'companyName is required when businessType is company'
      });
    }
  });

const serviceProviderDetailsSchema = z.object({
  providerType: z.enum(['general_service', 'event_management']).default('general_service'),
  serviceAreas: z.array(z.string().min(1)).min(1).max(30),
  yearsOfExperience: z.number().int().min(0).max(80).optional(),
  teamSize: z.number().int().min(1).max(100000).optional(),
  specialties: z.array(z.string().min(1)).max(50).optional().default([]),
  portfolioUrls: z.array(z.string().url()).max(20).optional().default([])
});

const eventProviderDetailsSchema = z.object({
  organizationName: z.string().min(2).max(120),
  eventTypes: z.array(z.string().min(1)).min(1).max(30),
  teamSize: z.number().int().min(1).max(100000).optional(),
  pastEventsCount: z.number().int().min(0).max(1000000).optional(),
  portfolioUrls: z.array(z.string().url()).max(20).optional().default([])
});

const venueProviderDetailsSchema = z.object({
  venueName: z.string().min(2).max(120),
  venueType: z.string().min(2).max(60),
  capacity: z.number().int().min(1).max(1000000),
  amenities: z.array(z.string().min(1)).max(80).optional().default([])
});

export const submitOnboardingSchema = z.object({
  body: z
    .object({
      verification: verificationSchema,
      stripeAccountId: z
        .string()
        .min(1)
        .max(128)
        .regex(/^acct_[A-Za-z0-9]+$/, 'stripeAccountId must be a valid Stripe account id'),
      businessAddress: z.string().min(3).max(240).optional(),
      serviceProvider: serviceProviderDetailsSchema.optional(),
      eventProvider: eventProviderDetailsSchema.optional(),
      venueProvider: venueProviderDetailsSchema.optional()
    })
    .strict()
    .superRefine((data, ctx) => {
      const variantCount =
        Number(Boolean(data.serviceProvider)) +
        Number(Boolean(data.eventProvider)) +
        Number(Boolean(data.venueProvider));

      if (variantCount !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Exactly one onboarding profile is required: serviceProvider, eventProvider, or venueProvider'
        });
      }
    }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});
