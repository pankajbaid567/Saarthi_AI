import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validateRequest } from '../middleware/request-validation.js';
import { submitWeeklyEssaySchema } from '../schemas/essays.schema.js';
import { createEssayService, type EssayService } from '../services/essay.service.js';

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

type CreateEssaysRouterOptions = {
  essayService?: EssayService;
};

export const createEssaysRouter = (options: CreateEssaysRouterOptions = {}): Router => {
  const router = Router();
  const essayService = options.essayService ?? createEssayService();

  router.get(
    '/essays/weekly/question',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (_req, res) => {
      res.status(200).json(essayService.getWeeklyQuestion());
    }),
  );

  router.post(
    '/essays/weekly/submit',
    authRateLimiter,
    authMiddleware,
    validateRequest(submitWeeklyEssaySchema),
    asyncHandler(async (req, res) => {
      res.status(201).json(essayService.submitWeeklyEssay(req.authUser!.userId, req.body.answer));
    }),
  );

  router.get(
    '/essays/submissions',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.status(200).json(essayService.listSubmissions(req.authUser!.userId));
    }),
  );

  return router;
};
