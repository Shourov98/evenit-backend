import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const buildObjectIdParamSchema = (fieldName: string, label: string) =>
  z.object({
    body: z.object({}).optional().default({}),
    params: z.object({
      [fieldName]: z.string().regex(objectIdRegex, `Invalid ${label}`)
    }),
    query: z.object({}).optional().default({})
  });

export const approvalRequestsQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    sortBy: z.string().trim().min(1).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
});

export const analyticsYearQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    year: z.coerce.number().int().min(2000).max(3000)
  })
});

export const venueIdParamSchema = buildObjectIdParamSchema('venueId', 'venueId');

export const serviceIdParamSchema = buildObjectIdParamSchema('serviceId', 'serviceId');

export const createAdminSchema = z.object({
  body: z.object({
    fullName: z.string().min(3).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(64)
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

export const adminUserIdParamSchema = buildObjectIdParamSchema('adminUserId', 'adminUserId');

export const customerIdParamSchema = buildObjectIdParamSchema('customerId', 'customerId');

export const subscriptionUserIdParamSchema = buildObjectIdParamSchema(
  'subscriptionUserId',
  'subscriptionUserId'
);

export const serviceProviderUserIdParamSchema = buildObjectIdParamSchema(
  'serviceProviderId',
  'serviceProviderId'
);

export const venueProviderUserIdParamSchema = buildObjectIdParamSchema('venueProviderId', 'venueProviderId');

export const eventPlannerUserIdParamSchema = buildObjectIdParamSchema('eventPlannerId', 'eventPlannerId');

export const updateAdminProfileSchema = z.object({
  body: z
    .object({
      fullName: z.string().trim().min(3).max(80).optional(),
      phoneNumber: z.string().trim().min(6).max(30).optional()
    })
    .refine((value) => value.fullName !== undefined || value.phoneNumber !== undefined, {
      message: 'Provide at least one field to update'
    }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

export const changeAdminPasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(8).max(64),
    newPassword: z.string().min(8).max(64)
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});
