import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const monthRegex = /^\d{4}-\d{2}$/;

export const eventPlannerAvailabilityQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    month: z.string().regex(monthRegex, 'month must be in YYYY-MM format').optional()
  })
});

export const updateEventPlannerAvailabilitySchema = z.object({
  body: z.object({
    date: z.string().regex(dateRegex, 'date must be in YYYY-MM-DD format')
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});
