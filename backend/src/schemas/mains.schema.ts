import { z } from 'zod';

const idSchema = z.string().uuid();
const mainsQuestionTypeSchema = z.enum(['gs', 'essay', 'ethics', 'optional']);
const mainsQuestionSourceSchema = z.enum(['pyq', 'coaching', 'ai_generated']);

export const listMainsQuestionsSchema = z.object({
  query: z.object({
    topicId: idSchema.optional(),
    type: mainsQuestionTypeSchema.optional(),
    source: mainsQuestionSourceSchema.optional(),
    marks: z.coerce.number().int().min(5).max(25).optional(),
    search: z.string().trim().min(1).max(200).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  }),
});

export const mainsQuestionIdSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const createMainsQuestionSchema = z.object({
  body: z.object({
    topicId: idSchema,
    type: mainsQuestionTypeSchema,
    source: mainsQuestionSourceSchema,
    marks: z.number().int().min(5).max(25),
    questionText: z.string().min(20).max(4000),
    modelAnswer: z.string().min(20).max(15000).nullable().optional(),
    suggestedWordLimit: z.number().int().min(100).max(500).default(250),
    year: z.number().int().min(1990).max(new Date().getFullYear()).nullable().optional(),
  }),
});
