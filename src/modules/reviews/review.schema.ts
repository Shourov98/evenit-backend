import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

export const createReviewSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
    comment: z.string().trim().min(2).max(2000, 'Comment must be between 2 and 2000 characters')
  }),
  params: z.object({
    bookingId: z.string().regex(objectIdRegex, 'Invalid bookingId')
  }),
  query: z.object({}).optional().default({})
});

export const getReviewsQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    sortBy: z.string().trim().min(1).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
});

export const getTargetReviewsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    targetId: z.string().regex(objectIdRegex, 'Invalid targetId')
  }),
  query: getReviewsQuerySchema.shape.query
});

export const getProviderReviewsSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    providerId: z.string().regex(objectIdRegex, 'Invalid providerId')
  }),
  query: getReviewsQuerySchema.shape.query
});
