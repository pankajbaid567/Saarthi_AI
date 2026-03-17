import { z } from 'zod';

export const submitWeeklyEssaySchema = z.object({
  body: z.object({
    answer: z.string().min(100).max(30000),
  }),
});
