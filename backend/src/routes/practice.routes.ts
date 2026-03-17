import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { createFeedbackLoopService, type FeedbackLoopService } from '../services/feedback-loop.service.js';

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

type CreatePracticeRouterOptions = {
  feedbackLoopService?: FeedbackLoopService;
};

export const createPracticeRouter = (options: CreatePracticeRouterOptions = {}): Router => {
  const router = Router();
  const feedbackLoopService = options.feedbackLoopService ?? createFeedbackLoopService();

  router.get(
    '/practice/feedback-loop',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.status(200).json(feedbackLoopService.getFeedbackLoop(req.authUser!.userId));
    }),
  );

  router.get(
    '/practice/non-repetition/stats',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.status(200).json(feedbackLoopService.getNonRepetitionStats(req.authUser!.userId));
    }),
  );

  return router;
};
