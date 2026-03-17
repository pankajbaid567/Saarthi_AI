import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validateRequest } from '../middleware/request-validation.js';
import { performanceSubjectSchema, performanceTopicSchema } from '../schemas/performance.schema.js';
import { createPerformanceService, type PerformanceService } from '../services/performance.service.js';

type CreatePerformanceRouterOptions = {
  performanceService?: PerformanceService;
};

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

export const createPerformanceRouter = (options: CreatePerformanceRouterOptions = {}): Router => {
  const router = Router();
  const performanceService = options.performanceService ?? createPerformanceService();

  router.get(
    '/performance/overview',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      const data = performanceService.getOverview(req.authUser!.userId);
      res.status(200).json({ success: true, data, ...data });
    }),
  );

  router.get(
    '/performance/subject/:id',
    authRateLimiter,
    authMiddleware,
    validateRequest(performanceSubjectSchema),
    asyncHandler(async (req, res) => {
      const data = performanceService.getSubject(req.authUser!.userId, req.params.id);
      res.status(200).json({ success: true, data, ...data });
    }),
  );

  router.get(
    '/performance/topic/:id',
    authRateLimiter,
    authMiddleware,
    validateRequest(performanceTopicSchema),
    asyncHandler(async (req, res) => {
      const data = performanceService.getTopic(req.authUser!.userId, req.params.id);
      res.status(200).json({ success: true, data, ...data });
    }),
  );

  router.get(
    '/performance/predictions',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.status(200).json({
        success: true,
        data: performanceService.getPredictions(req.authUser!.userId),
      });
    }),
  );

  router.get(
    '/performance/weak-areas',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      const data = performanceService.getWeakAreas(req.authUser!.userId);
      res.status(200).json({ success: true, data, weakAreas: data });
    }),
  );

  return router;
};
