import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

const bookingIdParamsSchema = z.object({
  bookingId: z.string().regex(objectIdRegex, 'Invalid bookingId')
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

