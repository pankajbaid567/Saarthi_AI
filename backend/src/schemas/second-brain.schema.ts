import { z } from 'zod';

const idSchema = z.string().uuid();
const importanceSchema = z.enum(['low', 'medium', 'high']);

export const listSecondBrainEntriesSchema = z.object({
  query: z.object({
    q: z.string().min(1).max(200).optional(),
    tag: z.string().min(1).max(80).optional(),
  }),
});

export const createSecondBrainEntrySchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    content: z.string().min(1).max(10000),
    tags: z.array(z.string().min(1).max(80)).max(10).optional(),
    importance: importanceSchema.optional(),
  }),
});

export const updateSecondBrainEntrySchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z
    .object({
      title: z.string().min(1).max(200).optional(),
      content: z.string().min(1).max(10000).optional(),
      tags: z.array(z.string().min(1).max(80)).max(10).optional(),
      importance: importanceSchema.optional(),
    })
    .refine((value) => Object.keys(value).length > 0, {
      message: 'At least one field is required',
    }),
});

export const deleteSecondBrainEntrySchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});
