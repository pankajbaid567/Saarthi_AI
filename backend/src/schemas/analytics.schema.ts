import { z } from 'zod';

export const testAnalyticsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
