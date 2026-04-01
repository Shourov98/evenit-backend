import { z } from 'zod';

export const createUsersSchema = z.object({
  body: z.object({
    name: z.string().min(1)
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});

export const getUserProfileSchema = z.object({
  body: z.object({}).optional().default({}),
  params: z.object({
    userId: z.string().min(1, 'userId is required')
  }),
  query: z.object({}).optional().default({})
});
