import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const availabilityOverrideSchema = z.object({
  date: z.string().regex(dateRegex, 'date must be in YYYY-MM-DD format'),
  status: z.enum(['available', 'pending', 'booked'])
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
    basePrice: z.number().min(0),
    currency: z.string().length(3).default('BDT'),
    discount: z
      .object({
        type: z.enum(['percentage', 'fixed']),
        value: z.number().min(0)
      })
      .optional(),
    amenities: z.record(z.boolean()).optional().default({})
  }),
  capacity: z.object({
    maximumGuests: z.number().int().min(1)
  }),
  media: z.object({
    galleryImages: z.array(z.string().url()).max(10).optional().default([]),
    videoUrl: z.string().url().optional()
  }),
  availabilityOverrides: z.array(availabilityOverrideSchema).optional().default([])
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
    availabilityOverrides: z.array(availabilityOverrideSchema).optional()
  })
  .superRefine((data, ctx) => {
    if (Object.keys(data).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'At least one field is required to update venue'
      });
    }
  });

const withUniqueAvailabilityDates = <T extends z.ZodTypeAny>(schema: T) =>
  schema.superRefine((data, ctx) => {
    const payload = data as { availabilityOverrides?: Array<{ date: string }> };
    const seen = new Set<string>();
    const availability = payload.availabilityOverrides || [];
    for (const item of availability) {
      if (seen.has(item.date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['availabilityOverrides'],
          message: 'availabilityOverrides cannot contain duplicate dates'
        });
        return;
      }
      seen.add(item.date);
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
