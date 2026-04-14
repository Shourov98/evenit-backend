import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const bookingIdParamsSchema = z.object({
  bookingId: z.string().regex(objectIdRegex, 'Invalid bookingId')
});

export const orderChatConversationListQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    sortBy: z.string().trim().min(1).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional()
  })
});

export const orderChatMessagesQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: bookingIdParamsSchema,
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional()
  })
});

export const sendOrderChatMessageSchema = z.object({
  body: z.object({
    content: z.string().trim().min(1).max(2000)
  }),
  params: bookingIdParamsSchema,
  query: z.object({}).optional().default({})
});
