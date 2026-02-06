import { z } from 'zod';

export const createUsersSchema = z.object({
  body: z.object({
    name: z.string().min(1)
  }),
  params: z.object({}).optional().default({}),
  query: z.object({}).optional().default({})
});
