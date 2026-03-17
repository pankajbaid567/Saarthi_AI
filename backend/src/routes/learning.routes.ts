import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validateRequest } from '../middleware/request-validation.js';
import {
  createUserBookmarkSchema,
  createUserHighlightSchema,
  deleteUserBookmarkSchema,
  deleteUserHighlightSchema,
  markTopicProgressSchema,
  searchContentSchema,
  topicIdSchema,
} from '../schemas/learning.schema.js';
import { createLearningService, type LearningService } from '../services/learning.service.js';

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

type CreateLearningRouterOptions = {
  learningService?: LearningService;
};

export const createLearningRouter = (options: CreateLearningRouterOptions = {}): Router => {
  const router = Router();
  const learningService = options.learningService ?? createLearningService();

  router.get(
    '/topics/:id/notes',
    validateRequest(topicIdSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(learningService.getTopicNotes(req.params.id));
    }),
  );

  router.get(
    '/topics/:id/pyqs',
    validateRequest(topicIdSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(learningService.getTopicSectionContent(req.params.id, 'pyqs'));
    }),
  );

  router.get(
    '/topics/:id/highlights',
    validateRequest(topicIdSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(learningService.getTopicSectionContent(req.params.id, 'highlights'));
    }),
  );

  router.get(
    '/topics/:id/micro-notes',
    validateRequest(topicIdSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(learningService.getTopicSectionContent(req.params.id, 'micro-notes'));
    }),
  );

  router.post(
    '/progress/topic/:id',
    authRateLimiter,
    authMiddleware,
    validateRequest(markTopicProgressSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(learningService.markTopicProgress(req.authUser!.userId, req.params.id, req.body));
    }),
  );

  router.get(
    '/progress',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.status(200).json(learningService.getOverallProgress(req.authUser!.userId));
    }),
  );

  router.post(
    '/user/highlights',
    authRateLimiter,
    authMiddleware,
    validateRequest(createUserHighlightSchema),
    asyncHandler(async (req, res) => {
      res.status(201).json(learningService.createUserHighlight(req.authUser!.userId, req.body));
    }),
  );

  router.get(
    '/user/highlights',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.status(200).json(learningService.listUserHighlights(req.authUser!.userId));
    }),
  );

  router.delete(
    '/user/highlights/:id',
    authRateLimiter,
    authMiddleware,
    validateRequest(deleteUserHighlightSchema),
    asyncHandler(async (req, res) => {
      learningService.deleteUserHighlight(req.authUser!.userId, req.params.id);
      res.status(204).send();
    }),
  );

  router.post(
    '/user/bookmarks',
    authRateLimiter,
    authMiddleware,
    validateRequest(createUserBookmarkSchema),
    asyncHandler(async (req, res) => {
      res.status(201).json(learningService.createUserBookmark(req.authUser!.userId, req.body));
    }),
  );

  router.get(
    '/user/bookmarks',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      res.status(200).json(learningService.listUserBookmarks(req.authUser!.userId));
    }),
  );

  router.delete(
    '/user/bookmarks/:id',
    authRateLimiter,
    authMiddleware,
    validateRequest(deleteUserBookmarkSchema),
    asyncHandler(async (req, res) => {
      learningService.deleteUserBookmark(req.authUser!.userId, req.params.id);
      res.status(204).send();
    }),
  );

  router.get(
    '/content/search',
    validateRequest(searchContentSchema),
    asyncHandler(async (req, res) => {
      const query = req.query.q as string;
      const results = learningService.searchContent(query, {
        type: req.query.type as string | undefined,
        subject: req.query.subject as string | undefined,
        topic: req.query.topic as string | undefined,
      });

      const includeContext = req.query.includeContext === 'true';
      if (!includeContext) {
        res.status(200).json(results);
        return;
      }

      res.status(200).json({
        results,
        rag: learningService.getSearchContext(query),
      });
    }),
  );

  router.get(
    '/topics/:id/related-content',
    validateRequest(topicIdSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(learningService.getRelatedContent(req.params.id));
    }),
  );

  return router;
};
