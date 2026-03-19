import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { createPostLaunchService, type PostLaunchService } from '../services/post-launch.service.js';

type CreatePostLaunchRouterOptions = {
  postLaunchService?: PostLaunchService;
};

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

export const createPostLaunchRouter = (options: CreatePostLaunchRouterOptions = {}): Router => {
  const router = Router();
  const postLaunchService = options.postLaunchService ?? createPostLaunchService();

  router.get(
    '/features/community',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.status(200).json(postLaunchService.getCommunity(req.authUser!.userId));
    }),
  );

  router.post(
    '/features/community/forums/:topicId/messages',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      const entry = postLaunchService.addForumMessage(req.authUser!.userId, req.params.topicId, String(req.body.message ?? ''));
      res.status(201).json(entry);
    }),
  );

  router.get(
    '/features/advanced-ai',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.status(200).json(postLaunchService.getAdvancedAi(req.authUser!.userId));
    }),
  );

  router.post(
    '/features/advanced-ai/error-analysis',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      const analysis = postLaunchService.analyzeError({
        questionId: String(req.body.questionId ?? ''),
        userAnswer: String(req.body.userAnswer ?? ''),
        correctAnswer: String(req.body.correctAnswer ?? ''),
        topicId: req.body.topicId ? String(req.body.topicId) : undefined,
      });
      res.status(200).json(analysis);
    }),
  );

  router.get(
    '/features/content-expansion',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (_req, res) => {
      res.status(200).json(postLaunchService.getContentExpansion());
    }),
  );

  router.get(
    '/features/mobile',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (_req, res) => {
      res.status(200).json(postLaunchService.getMobileCompanion());
    }),
  );

  router.get(
    '/features/advanced-analytics',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (_req, res) => {
      res.status(200).json(postLaunchService.getAdvancedAnalytics());
    }),
  );

  return router;
};
