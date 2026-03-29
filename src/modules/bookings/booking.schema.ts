import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const timeSlotRegex = /^([01]\d|2[0-3]):00$/;
const isAllowedBookingHour = (timeSlot: string): boolean => {
  const hour = Number.parseInt(timeSlot.split(':')[0] || '', 10);
  return Number.isInteger(hour) && hour >= 8 && hour <= 23;
};

const createBookingBodyBaseSchema = z.object({
  targetType: z.enum(['venue', 'service', 'event']),
  targetId: z.string().regex(objectIdRegex, 'Invalid targetId'),
  bookingDate: z.string().regex(dateRegex, 'bookingDate must be in YYYY-MM-DD format'),
  timeSlots: z.array(z.string().regex(timeSlotRegex, 'timeSlots must use HH:00 format')).min(1).max(16),
  durationHours: z.number().int().min(1).max(24).optional(),
  location: z.string().min(2).max(240).optional(),
  specialInstructions: z.string().max(2000).optional()
});

const withBookingTimeValidation = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((data, ctx) => {
    const unique = new Set(data.timeSlots);
    if (unique.size !== data.timeSlots.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['timeSlots'],
        message: 'timeSlots cannot contain duplicates'
      });
    }

    for (const timeSlot of data.timeSlots) {
      if (!isAllowedBookingHour(timeSlot)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['timeSlots'],
          message: 'Bookings are only allowed between 08:00 and 23:00'
        });
        return;
      }
    }
  });

const createBookingBodySchema = withBookingTimeValidation(createBookingBodyBaseSchema);

const bookingIdParamsSchema = z.object({
  bookingId: z.string().regex(objectIdRegex, 'Invalid bookingId')
});

const serviceBookingParamsSchema = z.object({
  serviceId: z.string().regex(objectIdRegex, 'Invalid serviceId')
});

const venueBookingParamsSchema = z.object({
  venueId: z.string().regex(objectIdRegex, 'Invalid venueId')
});

const eventPlannerBookingParamsSchema = z.object({
  eventPlannerId: z.string().regex(objectIdRegex, 'Invalid eventPlannerId')
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

export const createServiceBookingSchema = z.object({
  body: withBookingTimeValidation(createBookingBodyBaseSchema.omit({ targetType: true, targetId: true })),
  params: serviceBookingParamsSchema,
  query: z.object({}).optional().default({})
});

export const createVenueBookingSchema = z.object({
  body: withBookingTimeValidation(createBookingBodyBaseSchema.omit({ targetType: true, targetId: true })),
  params: venueBookingParamsSchema,
  query: z.object({}).optional().default({})
});

export const createEventPlannerBookingSchema = z.object({
  body: withBookingTimeValidation(createBookingBodyBaseSchema.omit({ targetType: true, targetId: true })),
  params: eventPlannerBookingParamsSchema,
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
