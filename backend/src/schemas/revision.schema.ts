import { z } from 'zod';

const idSchema = z.string().uuid();

const recallQuestionTypeSchema = z.enum(['concept_recall', 'comparison', 'factual', 'application']);

export const startActiveRecallSchema = z.object({
  body: z.object({
    topicIds: z.array(idSchema).min(1).max(20),
    questionCount: z.number().int().min(1).max(50),
    types: z.array(recallQuestionTypeSchema).min(1).max(4).optional(),
  }),
});

export const activeRecallSessionIdSchema = z.object({
  params: z.object({
    sessionId: idSchema,
  }),
});

export const submitActiveRecallAnswerSchema = z.object({
  params: z.object({
    sessionId: idSchema,
  }),
  body: z.object({
    questionId: idSchema,
    userAnswer: z.string().min(1).max(5000),
    confidenceLevel: z.number().int().min(1).max(5).optional(),
  }),
});

export const startRevisionSprintSchema = z.object({
  body: z.object({
    durationMinutes: z.union([z.literal(15), z.literal(30), z.literal(45)]),
    subjectId: idSchema.optional(),
    crashMode: z.boolean().optional(),
    daysRemaining: z.number().int().min(1).max(30).optional(),
  }),
});

export const completeRevisionSprintSchema = z.object({
  params: z.object({
    sprintId: idSchema,
  }),
  body: z
    .object({
      completedTopicIds: z.array(idSchema).optional(),
      notes: z.string().max(2000).optional(),
    })
    .optional(),
});

export const listFlashcardsSchema = z.object({
  query: z.object({
    topicId: idSchema.optional(),
    subjectId: idSchema.optional(),
    due: z
      .union([z.literal('true'), z.literal('false')])
      .transform((value) => value === 'true')
      .optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const createFlashcardSchema = z.object({
  body: z.object({
    topicId: idSchema,
    front: z.string().min(1).max(500),
    back: z.string().min(1).max(5000),
const microNoteTierSchema = z.enum(['30sec', '2min', '5min']);

export const revisionDueQuerySchema = z.object({
  query: z.object({
    tier: microNoteTierSchema.optional(),
  }),
});

export const revisionReviewSchema = z.object({
  params: z.object({
    topicId: idSchema,
  }),
  body: z.object({
    recallQuality: z.number().int().min(1).max(5),
  }),
});

export const revisionTopicParamsSchema = z.object({
  params: z.object({
    topicId: idSchema,
  }),
});

export const revisionBulkCurveQuerySchema = z.object({
  query: z.object({
    subjectId: idSchema.optional(),
  }),
});

export const microNotesGenerateSchema = z.object({
  body: z.object({
    topicId: idSchema,
    sourceContent: z.string().min(1).max(25000).optional(),
  }),
});

export const microNotesIdSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const microNotesUpdateSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    tier: microNoteTierSchema.optional(),
    content: z.string().min(1).max(10000).optional(),
  }),
});
