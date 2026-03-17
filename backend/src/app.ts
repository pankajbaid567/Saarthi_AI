import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { AppError } from './errors/app-error.js';
import { errorHandler } from './middleware/error-handler.js';
import { validateRequest } from './middleware/request-validation.js';
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

  app.use((_req, _res, next) => {
    next(new AppError('Route not found', 404));
  });

  app.use(errorHandler);

  return app;
};
