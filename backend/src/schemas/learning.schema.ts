import { z } from 'zod';

const idSchema = z.string().uuid();

export const topicIdSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const markTopicProgressSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z
    .object({
      progressPercent: z.number().min(0).max(100).optional(),
      completed: z.boolean().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field is required',
    }),
});

export const createUserHighlightSchema = z.object({
  body: z.object({
    topicId: idSchema,
    contentNodeId: idSchema.optional(),
    highlightedText: z.string().min(1).max(5000),
    note: z.string().max(5000).nullable().optional(),
  }),
});

export const deleteUserHighlightSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const createUserBookmarkSchema = z.object({
  body: z.object({
    topicId: idSchema,
    contentNodeId: idSchema.optional(),
    title: z.string().min(1).max(200),
    note: z.string().max(5000).nullable().optional(),
  }),
});

export const deleteUserBookmarkSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const searchContentSchema = z.object({
  query: z.object({
    q: z.string().min(1).max(200),
  }),
});
