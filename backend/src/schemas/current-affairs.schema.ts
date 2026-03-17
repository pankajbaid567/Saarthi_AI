import { z } from 'zod';

const idSchema = z.string().uuid();

export const currentAffairsListSchema = z.object({
  query: z.object({
    month: z.coerce.number().int().min(1).max(12).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    topicId: idSchema.optional(),
    page: z.coerce.number().int().min(1).optional(),
  }),
});

export const currentAffairsByMonthSchema = z.object({
  params: z.object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2100),
  }),
});

export const currentAffairsDetailSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
});
