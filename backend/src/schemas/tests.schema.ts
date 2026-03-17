import { z } from 'zod';

const idSchema = z.string().uuid();
const optionSchema = z.enum(['A', 'B', 'C', 'D']);
const testTypeSchema = z.enum(['topic_wise', 'subtopic_wise', 'mixed', 'pyq', 'weak_area', 'custom']);

export const generateTestSchema = z.object({
  body: z.object({
    type: testTypeSchema,
    subjectId: idSchema.optional(),
    topicIds: z.array(idSchema).min(1).optional(),
    questionCount: z.number().int().min(1).max(200).optional(),
    timeLimitMinutes: z.number().int().min(1).max(240).optional(),
  }),
});

export const submitTestSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    responses: z.array(
      z.object({
        questionId: idSchema,
        selectedOption: optionSchema.nullable().optional(),
        timeTakenSeconds: z.number().int().min(0).optional(),
        isFlagged: z.boolean().optional(),
      }),
    ),
  }),
});

export const getTestSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const getTestResultsSchema = getTestSchema;

export const getTestHistorySchema = z.object({
  query: z.object({
    type: testTypeSchema.optional(),
  }),
});
