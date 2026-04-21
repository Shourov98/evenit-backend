import { z } from 'zod';
import { BOOKING_END_HOUR, BOOKING_START_HOUR } from '../../common/utils/availability';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const monthRegex = /^\d{4}-\d{2}$/;
const publishStatusSchema = z.enum(['pending', 'published', 'rejected']);

const hoursSchema = z.array(z.number().int().min(BOOKING_START_HOUR).max(BOOKING_END_HOUR)).min(1).max(16);

const availabilityEntrySchema = z.object({
  date: z.string().regex(dateRegex, 'date must be in YYYY-MM-DD format'),
  hours: hoursSchema
});

const withUniqueAvailabilityDates = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((data, ctx) => {
    const payload = data as { availabilityCalendar?: Array<{ date: string; hours: number[] }> };
    const seen = new Set<string>();
    const availability = payload.availabilityCalendar || [];
    for (const item of availability) {
      if (seen.has(item.date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['availabilityCalendar'],
          message: 'availabilityCalendar cannot contain duplicate dates'
        });
        return;
      }
      seen.add(item.date);

      const seenHours = new Set<number>();
      for (const hour of item.hours) {
        if (seenHours.has(hour)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['availabilityCalendar'],
            message: `availabilityCalendar for ${item.date} cannot contain duplicate hours`
          });
          return;
        }
        seenHours.add(hour);
      }
    }
  });

const venueBodySchema = z.object({
  information: z.object({
    venueName: z.string().min(2).max(120),
    venueType: z.string().min(2).max(60),
    description: z.string().max(2000).optional(),
    addressLine: z.string().min(3).max(240),
    city: z.string().min(2).max(80),
    area: z.string().max(80).optional()
  }),
  pricing: z.object({
    basePrice: z.number().min(0).optional(),
    pricePerPerson: z.number().min(0).optional(),
    currency: z.string().length(3).default('BDT'),
    discount: z
      .object({
        type: z.enum(['percentage', 'fixed']),
        value: z.number().min(0)
      })
      .optional(),
    amenities: z.record(z.boolean()).optional().default({})
  }).superRefine((pricing, ctx) => {
    if (typeof pricing.basePrice !== 'number' && typeof pricing.pricePerPerson !== 'number') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['pricePerPerson'],
        message: 'pricePerPerson is required'
      });
    }
  }),
  capacity: z.object({
    maximumGuests: z.number().int().min(1)
  }),
  media: z.object({
    galleryImages: z.array(z.string().url()).max(10).optional().default([]),
    videoUrl: z.string().url().optional()
  }),
  availabilityCalendar: z.array(availabilityEntrySchema).optional().default([])
});

const updateVenueBodySchema = z
  .object({
    information: z
      .object({
        venueName: z.string().min(2).max(120).optional(),
        venueType: z.string().min(2).max(60).optional(),
        description: z.string().max(2000).optional(),
        addressLine: z.string().min(3).max(240).optional(),
        city: z.string().min(2).max(80).optional(),
        area: z.string().max(80).optional()
      })
      .optional(),
    pricing: z
      .object({
        basePrice: z.number().min(0).optional(),
        pricePerPerson: z.number().min(0).optional(),
        currency: z.string().length(3).optional(),
        discount: z
          .object({
            type: z.enum(['percentage', 'fixed']),
            value: z.number().min(0)
          })
          .nullable()
          .optional(),
        amenities: z.record(z.boolean()).optional()
      })
      .optional(),
    capacity: z
      .object({
        maximumGuests: z.number().int().min(1).optional()
      })
      .optional(),
    media: z
      .object({
        galleryImages: z.array(z.string().url()).max(10).optional(),
        videoUrl: z.string().url().nullable().optional()
      })
      .optional(),
    availabilityCalendar: z.array(availabilityEntrySchema).optional()
  })
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field is required to update venue'
      });
    }
  });

export const createVenueSchema = z.object({
  body: withUniqueAvailabilityDates(venueBodySchema),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

export const updateVenueSchema = z.object({
  body: withUniqueAvailabilityDates(updateVenueBodySchema),
  params: z.object({
    venueId: z.string().regex(objectIdRegex, 'Invalid venueId')
  }),
  query: z.object({}).optional().default({})
});

export const venueIdParamSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    venueId: z.string().regex(objectIdRegex, 'Invalid venueId')
  }),
  query: z.object({}).optional().default({})
});

export const ownVenuesQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({}).optional().default({}),
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).optional(),
    sortBy: z.string().min(1).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    publishStatus: publishStatusSchema.optional()
  })
});

export const venueAvailabilityQuerySchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    venueId: z.string().regex(objectIdRegex, 'Invalid venueId')
  }),
  query: z.object({
    month: z.string().regex(monthRegex, 'month must be in YYYY-MM format').optional()
  })
});

export const updateVenueAvailabilitySchema = z.object({
  body: z.object({
    date: z.string().regex(dateRegex, 'date must be in YYYY-MM-DD format')
  }),
  params: z.object({
    venueId: z.string().regex(objectIdRegex, 'Invalid venueId')
  }),
  query: z.object({}).optional().default({})
});
