import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validateRequest } from '../middleware/request-validation.js';
import {
  currentAffairsByMonthSchema,
  currentAffairsDetailSchema,
  currentAffairsListSchema,
} from '../schemas/current-affairs.schema.js';
import { createCurrentAffairsService, type CurrentAffairsService } from '../services/current-affairs.service.js';

type CreateCurrentAffairsRouterOptions = {
  currentAffairsService?: CurrentAffairsService;
};

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

export const createCurrentAffairsRouter = (options: CreateCurrentAffairsRouterOptions = {}): Router => {
  const router = Router();
  const currentAffairsService = options.currentAffairsService ?? createCurrentAffairsService();

  router.get(
    '/current-affairs',
    authRateLimiter,
    authMiddleware,
    validateRequest(currentAffairsListSchema),
    asyncHandler(async (req, res) => {
      const result = currentAffairsService.list({
        month: req.query.month ? Number(req.query.month) : undefined,
        year: req.query.year ? Number(req.query.year) : undefined,
        topicId: req.query.topicId as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
      });

      res.status(200).json({
        success: true,
        ...result,
      });
    }),
  );

  router.get(
    '/current-affairs/:month/:year',
    authRateLimiter,
    authMiddleware,
    validateRequest(currentAffairsByMonthSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json({
        success: true,
        data: currentAffairsService.getMonthly(Number(req.params.month), Number(req.params.year)),
      });
    }),
  );

  router.get(
    '/current-affairs/:id',
    authRateLimiter,
    authMiddleware,
    validateRequest(currentAffairsDetailSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json({
        success: true,
        data: currentAffairsService.getById(req.params.id),
      });
    }),
  );

  return router;
};
