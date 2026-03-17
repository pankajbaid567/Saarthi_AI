import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validateRequest } from '../middleware/request-validation.js';
import {
  microNotesGenerateSchema,
  microNotesUpdateSchema,
  revisionBulkCurveQuerySchema,
  revisionDueQuerySchema,
  revisionReviewSchema,
  revisionTopicParamsSchema,
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

  router.get(
    '/revision/due',
    authRateLimiter,
    authMiddleware,
    validateRequest(revisionDueQuerySchema),
    asyncHandler(async (req, res) => {
      const tier = req.query.tier as '30sec' | '2min' | '5min' | undefined;
      res.status(200).json(revisionService.getDueCards(req.authUser!.userId, tier));
    }),
  );

  router.post(
    '/revision/:topicId/review',
    authRateLimiter,
    authMiddleware,
    validateRequest(revisionReviewSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(
        revisionService.submitReview(
          req.authUser!.userId,
          req.params.topicId,
          req.body.recallQuality as 1 | 2 | 3 | 4 | 5,
        ),
      );
    }),
  );

  router.get(
    '/revision/dashboard',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.status(200).json(revisionService.getDashboard(req.authUser!.userId));
    }),
  );

  router.get(
    '/revision/forgetting-curve/bulk',
    authRateLimiter,
    authMiddleware,
    validateRequest(revisionBulkCurveQuerySchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(revisionService.getBulkForgettingCurves(req.authUser!.userId, req.query.subjectId as string));
    }),
  );

  router.get(
    '/revision/forgetting-curve/:topicId',
    authRateLimiter,
    authMiddleware,
    validateRequest(revisionTopicParamsSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(revisionService.getForgettingCurve(req.authUser!.userId, req.params.topicId));
    }),
  );

  router.get(
    '/revision/retention-scores',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.status(200).json(revisionService.getRetentionScores(req.authUser!.userId));
    }),
  );

  router.get(
    '/revision/micro-notes/:topicId',
    authRateLimiter,
    authMiddleware,
    validateRequest(revisionTopicParamsSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(revisionService.getMicroNotes(req.authUser!.userId, req.params.topicId));
    }),
  );

  router.post(
    '/revision/micro-notes/generate',
    authRateLimiter,
    authMiddleware,
    validateRequest(microNotesGenerateSchema),
    asyncHandler(async (req, res) => {
      res
        .status(201)
        .json(revisionService.generateMicroNotes(req.authUser!.userId, req.body.topicId, req.body.sourceContent));
    }),
  );

  router.put(
    '/revision/micro-notes/:id',
    authRateLimiter,
    authMiddleware,
    validateRequest(microNotesUpdateSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(revisionService.updateMicroNote(req.authUser!.userId, req.params.id, req.body));
    }),
  );

  return router;
};
