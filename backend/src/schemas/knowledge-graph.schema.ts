import { z } from 'zod';

const idSchema = z.string().uuid();

export const subjectIdSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const createSubjectSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120),
    slug: z.string().min(2).max(120).optional(),
    description: z.string().max(500).nullable().optional(),
  }),
});

export const updateSubjectSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z
    .object({
      name: z.string().min(2).max(120).optional(),
      slug: z.string().min(2).max(120).optional(),
      description: z.string().max(500).nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field is required',
    }),
});

export const topicIdSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const createTopicSchema = z.object({
  body: z.object({
    subjectId: idSchema,
    parentTopicId: idSchema.nullable().optional(),
    name: z.string().min(2).max(140),
    slug: z.string().min(2).max(140).optional(),
    description: z.string().max(500).nullable().optional(),
  }),
});

export const updateTopicSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z
    .object({
      subjectId: idSchema.optional(),
      parentTopicId: idSchema.nullable().optional(),
      name: z.string().min(2).max(140).optional(),
      slug: z.string().min(2).max(140).optional(),
      description: z.string().max(500).nullable().optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field is required',
    }),
});

const contentNodeTypeSchema = z.enum(['concept', 'fact', 'highlight', 'micro_note']);

export const contentIdSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const createContentNodeSchema = z.object({
  body: z.object({
    topicId: idSchema,
    type: contentNodeTypeSchema,
    title: z.string().max(200).nullable().optional(),
    body: z.string().min(1).max(10000),
  }),
});

export const updateContentNodeSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z
    .object({
      topicId: idSchema.optional(),
      type: contentNodeTypeSchema.optional(),
      title: z.string().max(200).nullable().optional(),
      body: z.string().min(1).max(10000).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field is required',
    }),
});
