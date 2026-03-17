import { z } from 'zod';

export const echoRequestSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'message is required'),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
