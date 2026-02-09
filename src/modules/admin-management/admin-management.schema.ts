import { z } from 'zod';

const objectIdRegex = /^[a-fA-F0-9]{24}$/;

export const venueIdParamSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    venueId: z.string().regex(objectIdRegex, 'Invalid venueId')
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

