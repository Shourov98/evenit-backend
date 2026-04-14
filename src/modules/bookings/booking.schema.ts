import { z } from 'zod';
import { BOOKING_END_HOUR, BOOKING_START_HOUR } from '../../common/utils/availability';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const bookingStatusFilterValues = ['pending', 'approved', 'rejected', 'completed', 'confirmed', 'cancelled'] as const;

const hoursSchema = z.array(z.number().int().min(BOOKING_START_HOUR).max(BOOKING_END_HOUR)).min(1).max(16);

const createBookingBodyBaseSchema = z.object({
  targetType: z.enum(['venue', 'service', 'event']),
  targetId: z.string().regex(objectIdRegex, 'Invalid targetId'),
  bookingDate: z.string().regex(dateRegex, 'bookingDate must be in YYYY-MM-DD format'),
  hours: hoursSchema,
  guest_count: z.number().int().positive().optional(),
  location: z.string().min(2).max(240).optional(),
  specialInstructions: z.string().max(2000).optional()
});

const withBookingHourValidation = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((data, ctx) => {
    const payload = data as { hours: number[]; targetType?: 'venue' | 'service' | 'event'; guest_count?: number };
    const unique = new Set(payload.hours);
    if (unique.size !== payload.hours.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['hours'],
        message: 'hours cannot contain duplicates'
      });
    }

    if (payload.targetType === 'venue' && typeof payload.guest_count !== 'number') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['guest_count'],
        message: 'guest_count is required for venue bookings'
      });
    }
  });

const createBookingBodySchema = withBookingHourValidation(createBookingBodyBaseSchema);

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
  body: withBookingHourValidation(createBookingBodyBaseSchema.omit({ targetType: true, targetId: true })),
  params: serviceBookingParamsSchema,
  query: z.object({}).optional().default({})
});

export const createVenueBookingSchema = z.object({
  body: withBookingHourValidation(
    createBookingBodyBaseSchema.omit({ targetType: true, targetId: true }).extend({
      guest_count: z.number().int().positive()
    })
  ),
  params: venueBookingParamsSchema,
  query: z.object({}).optional().default({})
});

export const createEventPlannerBookingSchema = z.object({
  body: withBookingHourValidation(createBookingBodyBaseSchema.omit({ targetType: true, targetId: true })),
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

export const bookingListQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    sortBy: z.string().trim().min(1).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    status: z.enum(bookingStatusFilterValues).optional()
  })
});
