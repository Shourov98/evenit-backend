import { z } from 'zod';

export const createSubscriptionPaymentIntentSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

export const verifySubscriptionPaymentSchema = z.object({
  body: z.object({
    paymentIntentId: z.string().min(1, 'paymentIntentId is required')
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});
