import { z } from 'zod';

const idSchema = z.string().uuid();

export const performanceSubjectSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const performanceTopicSchema = performanceSubjectSchema;
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

