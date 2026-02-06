import { z } from 'zod';

const fullNameRule = z
  .string()
  .min(3)
  .max(80)
  .refine((value) => value.trim().split(/\s+/).length >= 2, {
    message: 'fullName must include at least first name and last name'
  });

const signupRoles = ['customer', 'service_provider', 'venue_provider'] as const;

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
