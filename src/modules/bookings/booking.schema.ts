import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeSlotRegex = /^([01]\d|2[0-3]):00$/;

const createBookingBodySchema = z
  .object({
    targetType: z.enum(['venue', 'service', 'event']),
    targetId: z.string().regex(objectIdRegex, 'Invalid targetId'),
    bookingDate: z.string().regex(dateRegex, 'bookingDate must be in YYYY-MM-DD format'),
    timeSlots: z.array(z.string().regex(timeSlotRegex, 'timeSlots must use HH:00 format')).min(1).max(24),
    durationHours: z.number().int().min(1).max(24).optional(),
    location: z.string().min(2).max(240).optional(),
    specialInstructions: z.string().max(2000).optional()
  })
  .superRefine((data, ctx) => {
    const unique = new Set(data.timeSlots);
    if (unique.size !== data.timeSlots.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['timeSlots'],
        message: 'timeSlots cannot contain duplicates'
      });
    }
  });

const bookingIdParamsSchema = z.object({
  bookingId: z.string().regex(objectIdRegex, 'Invalid bookingId')
});

export const createBookingSchema = z.object({
  body: createBookingBodySchema,
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

export const bookingIdParamSchema = z.object({
  body: z.object({}).optional().default({}),
  params: bookingIdParamsSchema,
  query: z.object({}).optional().default({})
});

export const rejectBookingSchema = z.object({
  body: z.object({
    reason: z.string().min(2).max(500).optional()
  }),
  params: bookingIdParamsSchema,
  query: z.object({}).optional().default({})
});

export const createPaymentIntentSchema = z.object({
  body: z.object({}).optional().default({}),
  params: bookingIdParamsSchema,
  query: z.object({}).optional().default({})
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    paymentIntentId: z.string().min(1)
  }),
  params: bookingIdParamsSchema,
  query: z.object({}).optional().default({})
});
