import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validateRequest } from '../middleware/request-validation.js';
import { cacheKeys, cacheTtlSeconds, getCachedJson, setCachedJson } from '../lib/cache.js';
import {
  generatePracticeSchema,
  getSubjectProgressSchema,
  submitDailyAnswerSchema,
  topicPracticeReadySchema,
  updateTopicStatusSchema,
} from '../schemas/syllabus-flow.schema.js';
import { createSyllabusFlowService, type SyllabusFlowService } from '../services/syllabus-flow.service.js';

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

type CreateSyllabusFlowRouterOptions = {
  syllabusFlowService?: SyllabusFlowService;
};

export const createSyllabusFlowRouter = (options: CreateSyllabusFlowRouterOptions = {}): Router => {
  const router = Router();
  const syllabusFlowService = options.syllabusFlowService ?? createSyllabusFlowService();

  router.get(
    '/syllabus/progress',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      const userId = req.authUser!.userId;
      const cacheKey = cacheKeys.syllabusProgress(userId);
      const cachedData = await getCachedJson<ReturnType<SyllabusFlowService['getProgress']>>(cacheKey);
      if (cachedData) {
        res.status(200).json(cachedData);
        return;
      }

      const data = syllabusFlowService.getProgress(userId);
      await setCachedJson(cacheKey, data, cacheTtlSeconds.syllabusProgress);
      res.status(200).json(data);
    }),
  );

  router.get(
    '/syllabus/progress/:subjectId',
    authRateLimiter,
    authMiddleware,
    validateRequest(getSubjectProgressSchema),
    asyncHandler(async (req, res) => {
      const userId = req.authUser!.userId;
      const cacheKey = cacheKeys.syllabusProgress(userId, req.params.subjectId);
      const cachedData = await getCachedJson<ReturnType<SyllabusFlowService['getSubjectProgress']>>(cacheKey);
      if (cachedData) {
        res.status(200).json(cachedData);
        return;
      }

      const data = syllabusFlowService.getSubjectProgress(userId, req.params.subjectId);
      await setCachedJson(cacheKey, data, cacheTtlSeconds.subjectTopicHierarchy);
      res.status(200).json(data);
    }),
  );

  router.put(
    '/syllabus/topics/:topicId/status',
    authRateLimiter,
    authMiddleware,
    validateRequest(updateTopicStatusSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(syllabusFlowService.updateTopicStatus(req.authUser!.userId, req.params.topicId, req.body));
    }),
  );

  router.get(
    '/syllabus/topics/:topicId/practice-ready',
    authRateLimiter,
    authMiddleware,
    validateRequest(topicPracticeReadySchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(syllabusFlowService.getTopicPracticeReady(req.authUser!.userId, req.params.topicId));
    }),
  );

  router.post(
    '/practice/daily/generate',
    authRateLimiter,
    authMiddleware,
    validateRequest(generatePracticeSchema),
    asyncHandler(async (req, res) => {
      res.status(201).json(syllabusFlowService.generateDailyPractice(req.authUser!.userId, req.body));
    }),
  );

  router.get(
    '/practice/daily',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      const userId = req.authUser!.userId;
      const cacheKey = cacheKeys.dailyPracticeQueue(userId);
      const cachedData = await getCachedJson<ReturnType<SyllabusFlowService['getDailyPracticeQueue']>>(cacheKey);
      if (cachedData) {
        res.status(200).json(cachedData);
        return;
      }

      const data = syllabusFlowService.getDailyPracticeQueue(userId);
      await setCachedJson(cacheKey, data, cacheTtlSeconds.dailyPracticeQueue);
      res.status(200).json(data);
    }),
  );

  router.post(
    '/practice/daily/:questionId/submit',
    authRateLimiter,
    authMiddleware,
    validateRequest(submitDailyAnswerSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(
        syllabusFlowService.submitDailyAnswer(req.authUser!.userId, req.params.questionId, req.body.selectedOption),
      );
    }),
  );

  router.get(
    '/practice/daily/results',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.status(200).json(syllabusFlowService.getDailyResults(req.authUser!.userId));
    }),
  );

  router.get(
    '/practice/history',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.status(200).json(syllabusFlowService.listPracticeHistory(req.authUser!.userId));
    }),
  );

  router.post(
    '/practice/mixed/generate',
    authRateLimiter,
    authMiddleware,
    validateRequest(generatePracticeSchema),
    asyncHandler(async (req, res) => {
      res.status(201).json(syllabusFlowService.generateMixedPractice(req.authUser!.userId, req.body));
    }),
  );

  return router;
};
