import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validateRequest } from '../middleware/request-validation.js';
import { testAnalyticsSchema } from '../schemas/analytics.schema.js';
import { createAnalyticsService, type AnalyticsService } from '../services/analytics.service.js';

type CreateAnalyticsRouterOptions = {
  analyticsService?: AnalyticsService;
};

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

export const createAnalyticsRouter = (options: CreateAnalyticsRouterOptions = {}): Router => {
  const router = Router();
  const analyticsService = options.analyticsService ?? createAnalyticsService();

  router.get(
    '/tests/:id/analytics',
    authRateLimiter,
    authMiddleware,
    validateRequest(testAnalyticsSchema),
    asyncHandler(async (req, res) => {
      const analytics = analyticsService.getAnalytics(req.params.id, req.authUser!.userId);
      const ai = analyticsService.generateAiInsights(analytics);

      res.status(200).json({
        ...analytics,
        ai,
      });
    }),
  );

  return router;
};
