import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validateRequest } from '../middleware/request-validation.js';
import {
  generateTestSchema,
  getTestHistorySchema,
  getTestResultsSchema,
  getTestSchema,
  submitTestSchema,
} from '../schemas/tests.schema.js';
import { createTestEngineService, type TestEngineService } from '../services/test-engine.service.js';

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

type CreateTestsRouterOptions = {
  testEngineService?: TestEngineService;
};

export const createTestsRouter = (options: CreateTestsRouterOptions = {}): Router => {
  const router = Router();
  const testEngineService = options.testEngineService ?? createTestEngineService();

  router.post(
    '/tests/generate',
    authRateLimiter,
    authMiddleware,
    validateRequest(generateTestSchema),
    asyncHandler(async (req, res) => {
      const result = await testEngineService.generateTest(req.authUser!.userId, req.body);
      res.status(201).json(result);
    }),
  );

  router.post(
    '/tests/:id/submit',
    authRateLimiter,
    authMiddleware,
    validateRequest(submitTestSchema),
    asyncHandler(async (req, res) => {
      const result = await testEngineService.submitTest(req.authUser!.userId, req.params.id, req.body.responses);
      res.status(200).json(result);
    }),
  );

  router.get(
    '/tests/history',
    authRateLimiter,
    authMiddleware,
    validateRequest(getTestHistorySchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(testEngineService.listHistory(req.authUser!.userId, req.query));
    }),
  );

  router.get(
    '/tests/:id/results',
    authRateLimiter,
    authMiddleware,
    validateRequest(getTestResultsSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(testEngineService.getResults(req.authUser!.userId, req.params.id));
    }),
  );

  router.get(
    '/tests/:id',
    authRateLimiter,
    authMiddleware,
    validateRequest(getTestSchema),
    asyncHandler(async (req, res) => {
      const test = await testEngineService.getTest(req.authUser!.userId, req.params.id);
      res.status(200).json(test);
    }),
  );

  return router;
};
