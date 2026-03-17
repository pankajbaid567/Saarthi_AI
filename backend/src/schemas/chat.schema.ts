import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const createChatSessionSchema = z.object({
  body: z.object({
    mode: z.enum(['rapid_fire', 'deep_concept', 'elimination_training', 'trap_questions']),
    subject: z.string().min(1).max(120),
    topic: z.string().min(1).max(120),
    title: z.string().min(1).max(200).optional(),
  }),
});

export const sendMessageSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    message: z.string().min(1).max(1000),
  }),
});

export const getSessionSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

export const listSessionsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});
