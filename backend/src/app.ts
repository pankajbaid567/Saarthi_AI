import compression from 'compression';
import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { AppError } from './errors/app-error.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { errorHandler } from './middleware/error-handler.js';
import { authRateLimiter } from './middleware/rate-limit.middleware.js';
import { requireRole } from './middleware/rbac.middleware.js';
import { validateRequest } from './middleware/request-validation.js';
import { createAnalyticsRouter } from './routes/analytics.routes.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createChatRouter } from './routes/chat.routes.js';
import { createCurrentAffairsRouter } from './routes/current-affairs.routes.js';
import { createEssaysRouter } from './routes/essays.routes.js';
import { createKnowledgeGraphRouter } from './routes/knowledge-graph.routes.js';
import { createLearningRouter } from './routes/learning.routes.js';
import { createMainsRouter } from './routes/mains.routes.js';
import { createPdfRouter } from './routes/pdf.routes.js';
import { createPerformanceRouter } from './routes/performance.routes.js';
import { createPracticeRouter } from './routes/practice.routes.js';
import { createRevisionRouter } from './routes/revision.routes.js';
import { createSecondBrainRouter } from './routes/second-brain.routes.js';
import { createStrategyRouter } from './routes/strategy.routes.js';
import { createSyllabusFlowRouter } from './routes/syllabus-flow.routes.js';
import { createTestsRouter } from './routes/tests.routes.js';
import { echoRequestSchema } from './schemas/echo.schema.js';
import type { AnalyticsService } from './services/analytics.service.js';
import type { PerformanceService } from './services/performance.service.js';

type CreateAppOptions = {
  analyticsService?: AnalyticsService;
  performanceService?: PerformanceService;
};

export const createApp = (options: CreateAppOptions = {}) => {
  const app = express();

  app.use(compression());
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
  app.use('/api/v1', createAnalyticsRouter({ analyticsService: options.analyticsService }));
  app.use('/api/v1', createKnowledgeGraphRouter());
  app.use('/api/v1', createLearningRouter());
  app.use('/api/v1', createPerformanceRouter({ performanceService: options.performanceService }));
  app.use('/api/v1', createRevisionRouter());
  app.use('/api/v1', createMainsRouter());
  app.use('/api/v1', createPdfRouter());
  app.use('/api/v1', createCurrentAffairsRouter());
  app.use('/api/v1', createTestsRouter());
  app.use('/api/v1', createEssaysRouter());
  app.use('/api/v1', createPracticeRouter());
  app.use('/api/v1', createSyllabusFlowRouter());
  app.use('/api/v1', createChatRouter());
  app.use('/api/v1', createStrategyRouter());
  app.use('/api/v1', createSecondBrainRouter());

  app.use((_req, _res, next) => {
    next(new AppError('Route not found', 404));
  });

  app.use(errorHandler);

  return app;
};
