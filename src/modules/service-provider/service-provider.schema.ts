import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const availabilityOverrideSchema = z.object({
  date: z.string().regex(dateRegex, 'date must be in YYYY-MM-DD format'),
  status: z.enum(['available', 'pending', 'booked'])
});

const createServiceBodySchema = z.object({
  information: z.object({
    serviceName: z.string().min(2).max(120),
    category: z.string().min(2).max(80),
    description: z.string().max(2000).optional(),
    serviceArea: z.array(z.string().min(1)).min(1).max(30),
    tags: z.array(z.string().min(1)).max(30).optional().default([])
  }),
  pricing: z.object({
    amount: z.number().min(0),
    pricingType: z.enum(['fixed', 'hourly', 'daily', 'package']).default('fixed'),
    currency: z.string().length(3).default('BDT'),
    discount: z
      .object({
        type: z.enum(['percentage', 'fixed']),
        value: z.number().min(0)
      })
      .optional()
  }),
  settings: z.object({
    amenities: z.record(z.boolean()).optional().default({}),
    capacity: z.number().int().min(1).optional()
  }),
  media: z.object({
    galleryImages: z.array(z.string().url()).max(10).optional().default([]),
    videoUrl: z.string().url().optional()
  }),
  availabilityOverrides: z.array(availabilityOverrideSchema).optional().default([])
});

const updateServiceBodySchema = z
  .object({
    information: z
      .object({
        serviceName: z.string().min(2).max(120).optional(),
        category: z.string().min(2).max(80).optional(),
        description: z.string().max(2000).optional(),
        serviceArea: z.array(z.string().min(1)).min(1).max(30).optional(),
        tags: z.array(z.string().min(1)).max(30).optional()
      })
      .optional(),
    pricing: z
      .object({
        amount: z.number().min(0).optional(),
        pricingType: z.enum(['fixed', 'hourly', 'daily', 'package']).optional(),
        currency: z.string().length(3).optional(),
        discount: z
          .object({
            type: z.enum(['percentage', 'fixed']),
            value: z.number().min(0)
          })
          .nullable()
          .optional()
      })
      .optional(),
    settings: z
      .object({
        amenities: z.record(z.boolean()).optional(),
        capacity: z.number().int().min(1).nullable().optional()
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
        message: 'At least one field is required to update service'
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

export const createServiceSchema = z.object({
  body: withUniqueAvailabilityDates(createServiceBodySchema),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

export const updateServiceSchema = z.object({
  body: withUniqueAvailabilityDates(updateServiceBodySchema),
  params: z.object({
    serviceId: z.string().regex(objectIdRegex, 'Invalid serviceId')
  }),
  query: z.object({}).optional().default({})
});

export const serviceIdParamSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    serviceId: z.string().regex(objectIdRegex, 'Invalid serviceId')
  }),
  query: z.object({}).optional().default({})
});

