import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateRequest } from '../middleware/request-validation.js';
import {
  getMainsQuestionSchema,
  getMainsSubmissionSchema,
  listMainsQuestionsSchema,
  listMainsSubmissionsSchema,
  overrideGateSchema,
  submitDailyMainsSchema,
  submitMainsAnswerSchema,
} from '../schemas/mains.schema.js';
import { createMainsEvaluationService, type MainsEvaluationService } from '../services/mains-evaluation.service.js';
import { createMainsService, type MainsService } from '../services/mains.service.js';

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

type CreateMainsRouterOptions = {
  mainsEvaluationService?: MainsEvaluationService;
  mainsService?: MainsService;
};

export const createMainsRouter = (options: CreateMainsRouterOptions = {}): Router => {
  const router = Router();
  const mainsEvaluationService = options.mainsEvaluationService ?? createMainsEvaluationService();
  const mainsService = options.mainsService ?? createMainsService();

  router.get(
    '/mains/questions',
    validateRequest(listMainsQuestionsSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(mainsEvaluationService.listQuestions(req.query));
    }),
  );

  router.get(
    '/mains/questions/:id',
    validateRequest(getMainsQuestionSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(mainsEvaluationService.getQuestion(req.params.id));
    }),
  );

  router.post(
    '/mains/submit',
    authRateLimiter,
    authMiddleware,
    validateRequest(submitMainsAnswerSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(mainsEvaluationService.submitAnswer(req.authUser!.userId, req.body));
    }),
  );

  router.get(
    '/mains/submissions',
    authRateLimiter,
    authMiddleware,
    validateRequest(listMainsSubmissionsSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(mainsEvaluationService.listSubmissions(req.authUser!.userId, req.query));
    }),
  );

  router.get(
    '/mains/submissions/:id',
    authRateLimiter,
    authMiddleware,
    validateRequest(getMainsSubmissionSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(mainsEvaluationService.getSubmission(req.authUser!.userId, req.params.id));
    }),
  );

  router.get(
    '/mains/daily/gate-status',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.status(200).json(mainsService.getGateStatus(req.authUser!.userId));
    }),
  );

  router.get(
    '/mains/daily/question',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.status(200).json(await mainsService.getDailyQuestion(req.authUser!.userId));
    }),
  );

  router.post(
    '/mains/daily/override-gate',
    authRateLimiter,
    authMiddleware,
    requireRole('admin'),
    validateRequest(overrideGateSchema),
    asyncHandler(async (req, res) => {
      const targetUserId = req.body.userId ?? req.authUser!.userId;
      const override = mainsService.overrideGate(targetUserId, req.authUser!.userId, req.body.reason);
      res.status(201).json(override);
    }),
  );

  router.post(
    '/mains/daily/submit',
    authRateLimiter,
    authMiddleware,
    validateRequest(submitDailyMainsSchema),
    asyncHandler(async (req, res) => {
      res.status(201).json(mainsService.submitDailyAnswer(req.authUser!.userId, req.body.answer));
    }),
  );

  return router;
};
