import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateRequest } from '../middleware/request-validation.js';
import {
  createMainsQuestionSchema,
  listMainsQuestionsSchema,
  mainsQuestionIdSchema,
} from '../schemas/mains.schema.js';
import { createMainsService, type MainsService } from '../services/mains.service.js';

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

type CreateMainsRouterOptions = {
  mainsService?: MainsService;
};

export const createMainsRouter = (options: CreateMainsRouterOptions = {}): Router => {
  const router = Router();
  const mainsService = options.mainsService ?? createMainsService();

  router.get(
    '/mains/questions',
    authRateLimiter,
    authMiddleware,
    validateRequest(listMainsQuestionsSchema),
    asyncHandler(async (req, res) => {
      const { topicId, type, source, marks, search, limit, offset } = req.query as {
        topicId?: string;
        type?: 'gs' | 'essay' | 'ethics' | 'optional';
        source?: 'pyq' | 'coaching' | 'ai_generated';
        marks?: string;
        search?: string;
        limit?: string;
        offset?: string;
      };
      const parsedMarks = marks ? Number(marks) : undefined;
      const parsedLimit = limit ? Number(limit) : undefined;
      const parsedOffset = offset ? Number(offset) : undefined;
      const { items, total } = mainsService.listQuestions({
        topicId,
        type,
        source,
        marks: parsedMarks,
        search,
        limit: parsedLimit,
        offset: parsedOffset,
      });
      res.status(200).json({
        items,
        total,
        limit: parsedLimit,
        offset: parsedOffset,
      });
    }),
  );

  router.get(
    '/mains/questions/:id',
    authRateLimiter,
    authMiddleware,
    validateRequest(mainsQuestionIdSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(mainsService.getQuestionById(req.params.id));
    }),
  );

  router.post(
    '/mains/questions',
    authRateLimiter,
    authMiddleware,
    requireRole('admin'),
    validateRequest(createMainsQuestionSchema),
    asyncHandler(async (req, res) => {
      res.status(201).json(mainsService.createQuestion(req.body));
    }),
  );

  return router;
};
