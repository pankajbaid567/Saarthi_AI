import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validateRequest } from '../middleware/request-validation.js';
import { completeStrategyTaskSchema, generateStrategySchema } from '../schemas/strategy.schema.js';
import { createStrategyService, type StrategyService } from '../services/strategy.service.js';

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

type CreateStrategyRouterOptions = {
  strategyService?: StrategyService;
};

export const createStrategyRouter = (options: CreateStrategyRouterOptions = {}): Router => {
  const router = Router();
  const strategyService = options.strategyService ?? createStrategyService();

  router.get(
    '/strategy/today',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.status(200).json(strategyService.getTodayPlan(req.authUser!.userId));
    }),
  );

  router.get(
    '/strategy/week',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.status(200).json(strategyService.getWeekPlan(req.authUser!.userId));
    }),
  );

  router.post(
    '/strategy/generate',
    authRateLimiter,
    authMiddleware,
    validateRequest(generateStrategySchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(strategyService.generate(req.authUser!.userId, req.body));
    }),
  );

  router.put(
    '/strategy/:id/complete',
    authRateLimiter,
    authMiddleware,
    validateRequest(completeStrategyTaskSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(strategyService.completeTask(req.authUser!.userId, req.params.id, req.body?.completed ?? true));
    }),
  );

  return router;
};
