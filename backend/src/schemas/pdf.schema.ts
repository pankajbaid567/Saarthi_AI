import { z } from 'zod';

export const pdfIdSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});
