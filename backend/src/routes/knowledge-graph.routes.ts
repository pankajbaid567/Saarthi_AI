import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateRequest } from '../middleware/request-validation.js';
import {
  contentIdSchema,
  createContentNodeSchema,
  createSubjectSchema,
  createTopicSchema,
  subjectIdSchema,
  topicIdSchema,
  updateContentNodeSchema,
  updateSubjectSchema,
  updateTopicSchema,
} from '../schemas/knowledge-graph.schema.js';
import {
  createKnowledgeGraphService,
  type KnowledgeGraphService,
} from '../services/knowledge-graph.service.js';

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

type CreateKnowledgeGraphRouterOptions = {
  knowledgeGraphService?: KnowledgeGraphService;
};

export const createKnowledgeGraphRouter = (options: CreateKnowledgeGraphRouterOptions = {}): Router => {
  const router = Router();
  const knowledgeGraphService = options.knowledgeGraphService ?? createKnowledgeGraphService();

  router.get(
    '/subjects',
    asyncHandler(async (_req, res) => {
      res.status(200).json(knowledgeGraphService.listSubjects());
    }),
  );

  router.get(
    '/subjects/:id',
    validateRequest(subjectIdSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(knowledgeGraphService.getSubject(req.params.id));
    }),
  );

  router.post(
    '/subjects',
    authRateLimiter,
    authMiddleware,
    requireRole('admin'),
    validateRequest(createSubjectSchema),
    asyncHandler(async (req, res) => {
      res.status(201).json(knowledgeGraphService.createSubject(req.body));
    }),
  );

  router.put(
    '/subjects/:id',
    authRateLimiter,
    authMiddleware,
    requireRole('admin'),
    validateRequest(updateSubjectSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(knowledgeGraphService.updateSubject(req.params.id, req.body));
    }),
  );

  router.delete(
    '/subjects/:id',
    authRateLimiter,
    authMiddleware,
    requireRole('admin'),
    validateRequest(subjectIdSchema),
    asyncHandler(async (req, res) => {
      knowledgeGraphService.deleteSubject(req.params.id);
      res.status(204).send();
    }),
  );

  router.get(
    '/subjects/:id/topics',
    validateRequest(subjectIdSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(knowledgeGraphService.listTopicsForSubject(req.params.id));
    }),
  );

  router.get(
    '/topics/:id',
    validateRequest(topicIdSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(knowledgeGraphService.getTopicWithSubtopics(req.params.id));
    }),
  );

  router.get(
    '/topics/:id/subtopics',
    validateRequest(topicIdSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(knowledgeGraphService.getSubtopics(req.params.id));
    }),
  );

  router.post(
    '/topics',
    authRateLimiter,
    authMiddleware,
    requireRole('admin'),
    validateRequest(createTopicSchema),
    asyncHandler(async (req, res) => {
      res.status(201).json(knowledgeGraphService.createTopic(req.body));
    }),
  );

  router.put(
    '/topics/:id',
    authRateLimiter,
    authMiddleware,
    requireRole('admin'),
    validateRequest(updateTopicSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(knowledgeGraphService.updateTopic(req.params.id, req.body));
    }),
  );

  router.delete(
    '/topics/:id',
    authRateLimiter,
    authMiddleware,
    requireRole('admin'),
    validateRequest(topicIdSchema),
    asyncHandler(async (req, res) => {
      knowledgeGraphService.deleteTopic(req.params.id);
      res.status(204).send();
    }),
  );

  router.get(
    '/topics/:id/content',
    validateRequest(topicIdSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(knowledgeGraphService.getTopicContent(req.params.id));
    }),
  );

  router.post(
    '/content',
    authRateLimiter,
    authMiddleware,
    requireRole('admin'),
    validateRequest(createContentNodeSchema),
    asyncHandler(async (req, res) => {
      res.status(201).json(knowledgeGraphService.createContentNode(req.body));
    }),
  );

  router.put(
    '/content/:id',
    authRateLimiter,
    authMiddleware,
    requireRole('admin'),
    validateRequest(updateContentNodeSchema),
    asyncHandler(async (req, res) => {
      res.status(200).json(knowledgeGraphService.updateContentNode(req.params.id, req.body));
    }),
  );

  router.delete(
    '/content/:id',
    authRateLimiter,
    authMiddleware,
    requireRole('admin'),
    validateRequest(contentIdSchema),
    asyncHandler(async (req, res) => {
      knowledgeGraphService.deleteContentNode(req.params.id);
      res.status(204).send();
    }),
  );

  return router;
};
