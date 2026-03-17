import { z } from 'zod';

export const performanceSubjectSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const performanceTopicSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});
