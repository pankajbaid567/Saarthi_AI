import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validateRequest } from '../middleware/request-validation.js';
import {
  activeRecallSessionIdSchema,
  completeRevisionSprintSchema,
  createFlashcardSchema,
  listFlashcardsSchema,
  startActiveRecallSchema,
  startRevisionSprintSchema,
  submitActiveRecallAnswerSchema,
} from '../schemas/revision.schema.js';
import { createRevisionService, type RevisionService } from '../services/revision.service.js';

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

type CreateRevisionRouterOptions = {
  revisionService?: RevisionService;
};

export const createRevisionRouter = (options: CreateRevisionRouterOptions = {}): Router => {
  const router = Router();
  const revisionService = options.revisionService ?? createRevisionService();

  router.post(
    '/revision/active-recall/start',
    authRateLimiter,
    authMiddleware,
    validateRequest(startActiveRecallSchema),
    asyncHandler(async (req, res) => {
      const result = revisionService.startActiveRecallSession(req.authUser!.userId, req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    }),
  );

  router.post(
    '/revision/active-recall/:sessionId/answer',
    authRateLimiter,
    authMiddleware,
    validateRequest(submitActiveRecallAnswerSchema),
    asyncHandler(async (req, res) => {
      const result = revisionService.submitActiveRecallAnswer(req.authUser!.userId, req.params.sessionId, req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    }),
  );

  router.get(
    '/revision/active-recall/:sessionId/results',
    authRateLimiter,
    authMiddleware,
    validateRequest(activeRecallSessionIdSchema),
    asyncHandler(async (req, res) => {
      const result = revisionService.getActiveRecallResults(req.authUser!.userId, req.params.sessionId);
      res.status(200).json({
        success: true,
        data: result,
      });
    }),
  );

  router.post(
    '/revision/sprint/start',
    authRateLimiter,
    authMiddleware,
    validateRequest(startRevisionSprintSchema),
    asyncHandler(async (req, res) => {
      const result = revisionService.startSprint(req.authUser!.userId, req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    }),
  );

  router.post(
    '/revision/sprint/:sprintId/complete',
    authRateLimiter,
    authMiddleware,
    validateRequest(completeRevisionSprintSchema),
    asyncHandler(async (req, res) => {
      const result = revisionService.completeSprint(req.authUser!.userId, req.params.sprintId, req.body);
      res.status(200).json({
        success: true,
        data: result,
      });
    }),
  );

  router.get(
    '/revision/sprint/history',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      const result = revisionService.listSprintHistory(req.authUser!.userId);
      res.status(200).json({
        success: true,
        data: result,
      });
    }),
  );

  router.get(
    '/revision/flashcards',
    authRateLimiter,
    authMiddleware,
    validateRequest(listFlashcardsSchema),
    asyncHandler(async (req, res) => {
      const result = revisionService.listFlashcards(req.authUser!.userId, req.query);
      res.status(200).json({
        success: true,
        data: result,
      });
    }),
  );

  router.post(
    '/revision/flashcards',
    authRateLimiter,
    authMiddleware,
    validateRequest(createFlashcardSchema),
    asyncHandler(async (req, res) => {
      const result = revisionService.createManualFlashcard(req.authUser!.userId, req.body);
      res.status(201).json({
        success: true,
        data: result,
      });
    }),
  );

  router.get(
    '/revision/predictions',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      const result = revisionService.getPredictions(req.authUser!.userId);
      res.status(200).json({
        success: true,
        data: result,
      });
    }),
  );

  router.get(
    '/revision/streaks',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      const result = revisionService.getStreaks(req.authUser!.userId);
      res.status(200).json({
        success: true,
        data: result,
      });
    }),
  );

  return router;
};
