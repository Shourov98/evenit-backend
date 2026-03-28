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
