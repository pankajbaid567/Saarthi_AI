import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodSchema } from 'zod';

import { AppError } from '../errors/app-error.js';

export const validateRequest = <T>(schema: ZodSchema<T>): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const details = result.error.issues.map((issue) => issue.message).join(', ');
      next(new AppError(`Validation failed: ${details}`, 400));
      return;
    }

    if (result.data) {
      if ('body' in (result.data as any)) req.body = (result.data as any).body;
      if ('query' in (result.data as any)) req.query = (result.data as any).query;
      if ('params' in (result.data as any)) req.params = (result.data as any).params;
    }

    next();
  };
};
