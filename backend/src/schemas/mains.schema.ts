import { z } from 'zod';

const idSchema = z.string().uuid();

export const overrideGateSchema = z.object({
  body: z.object({
    userId: idSchema.optional(),
    reason: z.string().min(3).max(500),
  }),
});

export const submitDailyMainsSchema = z.object({
  body: z.object({
    answer: z.string().min(30).max(20000),
  }),
});
