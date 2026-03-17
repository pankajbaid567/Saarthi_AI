import { z } from 'zod';

const idSchema = z.string().uuid();

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
