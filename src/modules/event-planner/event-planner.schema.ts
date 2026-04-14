import { z } from 'zod';
import { BOOKING_END_HOUR, BOOKING_START_HOUR } from '../../common/utils/availability';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const monthRegex = /^\d{4}-\d{2}$/;

const hoursSchema = z.array(z.number().int().min(BOOKING_START_HOUR).max(BOOKING_END_HOUR)).min(1).max(16);

export const eventPlannerAvailabilityQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    month: z.string().regex(monthRegex, 'month must be in YYYY-MM format').optional()
  })
});

export const updateEventPlannerAvailabilitySchema = z.object({
  body: z.object({
    date: z.string().regex(dateRegex, 'date must be in YYYY-MM-DD format'),
    hours: hoursSchema
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});
