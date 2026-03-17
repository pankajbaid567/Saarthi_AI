import { z } from 'zod';

const idSchema = z.string().uuid();
const optionSchema = z.enum(['A', 'B', 'C', 'D']);
const topicStatusSchema = z.enum(['not_started', 'in_progress', 'completed']);

export const getSubjectProgressSchema = z.object({
  params: z.object({
    subjectId: idSchema,
  }),
});

export const updateTopicStatusSchema = z.object({
  params: z.object({
    topicId: idSchema,
  }),
  body: z.object({
    status: topicStatusSchema,
    timeSpentMinutes: z.number().int().min(0).optional(),
  }),
});

export const topicPracticeReadySchema = z.object({
  params: z.object({
    topicId: idSchema,
  }),
});

export const generatePracticeSchema = z.object({
  body: z
    .object({
      questionCount: z.number().int().min(1).max(50).optional(),
    })
    .optional(),
});

export const submitDailyAnswerSchema = z.object({
  params: z.object({
    questionId: idSchema,
  }),
  body: z.object({
    selectedOption: optionSchema,
  }),
});
