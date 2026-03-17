import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validateRequest } from '../middleware/request-validation.js';
import {
  createChatSessionSchema,
  getSessionSchema,
  listSessionsSchema,
  sendMessageSchema,
} from '../schemas/chat.schema.js';
import { createChatService, type ChatService } from '../services/chat.service.js';

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

type CreateChatRouterOptions = {
  chatService?: ChatService;
};

export const createChatRouter = (options: CreateChatRouterOptions = {}): Router => {
  const router = Router();
  const chatService = options.chatService ?? createChatService();

  router.post(
    '/chat/session',
    authRateLimiter,
    authMiddleware,
    validateRequest(createChatSessionSchema),
    asyncHandler(async (req, res) => {
      const session = chatService.createSession({
        userId: req.authUser!.userId,
        mode: req.body.mode,
        subject: req.body.subject,
        topic: req.body.topic,
        title: req.body.title,
      });
      res.status(201).json(session);
    }),
  );

  router.get(
    '/chat/session/:id',
    authRateLimiter,
    authMiddleware,
    validateRequest(getSessionSchema),
    asyncHandler(async (req, res) => {
      const session = chatService.getSession(req.params.id, req.authUser!.userId);
      res.status(200).json(session);
    }),
  );

  router.post(
    '/chat/session/:id/message',
    authRateLimiter,
    authMiddleware,
    validateRequest(sendMessageSchema),
    asyncHandler(async (req, res) => {
      const result = chatService.sendMessage({
        userId: req.authUser!.userId,
        sessionId: req.params.id,
        message: req.body.message,
      });
      res.status(200).json(result);
    }),
  );

  router.post(
    '/chat/session/:id/message/stream',
    authRateLimiter,
    authMiddleware,
    validateRequest(sendMessageSchema),
    asyncHandler(async (req, res) => {
      const result = chatService.sendMessage({
        userId: req.authUser!.userId,
        sessionId: req.params.id,
        message: req.body.message,
      });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      chatService.buildSseChunks(result.response).forEach((chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      });

      res.write(`event: done\ndata: ${JSON.stringify({
        sessionId: result.session.id,
        isCorrect: result.isCorrect,
        summary: result.summary,
      })}\n\n`);
      res.end();
    }),
  );

  router.get(
    '/chat/sessions',
    authRateLimiter,
    authMiddleware,
    validateRequest(listSessionsSchema),
    asyncHandler(async (req, res) => {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const sessions = chatService.listSessions(req.authUser!.userId, limit);
      res.status(200).json(sessions);
    }),
  );

  return router;
};
