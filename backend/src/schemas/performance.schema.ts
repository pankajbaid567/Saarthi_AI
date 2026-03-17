import { z } from 'zod';

const idSchema = z.string().uuid();

export const performanceSubjectSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const performanceTopicSchema = performanceSubjectSchema;
