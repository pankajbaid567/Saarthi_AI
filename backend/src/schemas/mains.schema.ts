import { z } from 'zod';

const idSchema = z.string().uuid();

export const listMainsQuestionsSchema = z.object({
  query: z.object({
    topicId: idSchema.optional(),
    type: z.enum(['pyq', 'coaching', 'ai_generated']).optional(),
    marks: z.coerce.number().int().positive().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

export const getMainsQuestionSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const submitMainsAnswerSchema = z.object({
  body: z.object({
    questionId: idSchema,
    answerText: z.string().trim().min(30).max(20_000),
    wordCount: z.number().int().positive().max(3000).optional(),
  }),
});

export const listMainsSubmissionsSchema = z.object({
  query: z.object({
    topicId: idSchema.optional(),
    questionId: idSchema.optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

export const getMainsSubmissionSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});
