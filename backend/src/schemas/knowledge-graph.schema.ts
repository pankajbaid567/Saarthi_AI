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
    paper: z.string().max(40).nullable().optional(),
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
      paper: z.string().max(40).nullable().optional(),
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

const contentNodeTypeSchema = z.enum(['concept', 'fact', 'highlight', 'micro_note', 'pyq']);
const autoLinkReviewStatusSchema = z.enum(['pending', 'approved', 'rejected', 'merged']);

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

const extractedTextSchema = z.object({
  text: z.string().min(1).max(10000),
});

export const autoLinkExtractedContentSchema = z.object({
  body: z
    .object({
      mcqs: z
        .array(
          z.object({
            question: z.string().min(1).max(2000),
            options: z.array(z.string().min(1).max(500)).min(2).max(6),
            explanation: z.string().max(5000).optional(),
          }),
        )
        .optional(),
      concepts: z.array(extractedTextSchema).optional(),
      facts: z.array(extractedTextSchema).optional(),
      mainsQuestions: z
        .array(
          z.object({
            question: z.string().min(1).max(3000),
            marks: z.number().int().min(1).max(50).optional(),
            modelAnswer: z.string().max(10000).optional(),
          }),
        )
        .optional(),
    })
    .refine((value) => Object.values(value).some((list) => list && list.length > 0), {
      message: 'At least one extracted content category is required',
    }),
});

export const listAutoLinkReviewItemsSchema = z.object({
  query: z.object({
    status: autoLinkReviewStatusSchema.optional(),
  }),
});

export const approveAutoLinkReviewItemSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z
    .object({
      topicId: idSchema.optional(),
      editedText: z.string().min(1).max(10000).optional(),
    })
    .optional()
    .default({}),
});

export const rejectAutoLinkReviewItemSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});

export const mergeAutoLinkReviewItemsSchema = z.object({
  body: z.object({
    primaryId: idSchema,
    duplicateId: idSchema,
  }),
});

export const createTopicFromSuggestionSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z.object({
    subjectId: idSchema,
    name: z.string().min(2).max(140).optional(),
  }),
});
