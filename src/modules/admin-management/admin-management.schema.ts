import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

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

export const venueIdParamSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    venueId: z.string().regex(objectIdRegex, 'Invalid venueId')
  }),
  query: z.object({}).optional().default({})
});

export const serviceIdParamSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    serviceId: z.string().regex(objectIdRegex, 'Invalid serviceId')
  }),
  query: z.object({}).optional().default({})
});

export const createAdminSchema = z.object({
  body: z.object({
    fullName: z.string().min(3).max(80),
    email: z.string().email(),
    password: z.string().min(8).max(64)
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

export const adminUserIdParamSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    adminUserId: z.string().regex(objectIdRegex, 'Invalid adminUserId')
  }),
  query: z.object({}).optional().default({})
});
