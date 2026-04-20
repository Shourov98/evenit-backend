import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

export const notificationListQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    sortBy: z.string().trim().min(1).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    isRead: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
    category: z.enum(['admin', 'booking', 'subscription', 'message']).optional()
  })
});

export const notificationIdParamSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    notificationId: z.string().regex(objectIdRegex, 'Invalid notificationId')
  }),
  query: z.object({}).optional().default({})
});

export const emptyNotificationBodySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});
