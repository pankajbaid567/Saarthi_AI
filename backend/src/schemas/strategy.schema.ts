import { z } from 'zod';

const idSchema = z.string().uuid();

export const completeStrategyTaskSchema = z.object({
  params: z.object({
    id: idSchema,
  }),
  body: z
    .object({
      completed: z.boolean().optional(),
    })
    .optional(),
});

export const generateStrategySchema = z.object({
  body: z
    .object({
      syllabusCoveragePercent: z.number().min(0).max(100).optional(),
      weakAreas: z.array(z.string().min(1).max(200)).max(10).optional(),
      retentionUrgencyCount: z.number().int().min(0).max(20).optional(),
      timeAvailableMinutes: z.number().int().min(60).max(720).optional(),
      targetDate: z.string().datetime().optional(),
      prelimsFocusPercent: z.number().min(0.2).max(0.9).optional(),
    })
    .optional(),
});
