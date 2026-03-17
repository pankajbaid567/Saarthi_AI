import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { AppError } from './errors/app-error.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error-handler.js';
import { authRateLimiter } from './middleware/rate-limit.middleware.js';
import { requireRole } from './middleware/rbac.middleware.js';
import { validateRequest } from './middleware/request-validation.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createChatRouter } from './routes/chat.routes.js';
import { createKnowledgeGraphRouter } from './routes/knowledge-graph.routes.js';
import { createLearningRouter } from './routes/learning.routes.js';
import { echoRequestSchema } from './schemas/echo.schema.js';

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.post('/api/v1/system/echo', validateRequest(echoRequestSchema), (req, res) => {
    res.status(200).json({ message: req.body.message });
  });

  app.get('/api/v1/system/admin/ping', authRateLimiter, authMiddleware, requireRole('admin'), (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/v1/auth', createAuthRouter());
  app.use('/api/v1', createKnowledgeGraphRouter());
  app.use('/api/v1', createLearningRouter());
  app.use('/api/v1', createChatRouter());

  app.use((_req, _res, next) => {
    next(new AppError('Route not found', 404));
  });

  app.use(errorHandler);

  return app;
};
