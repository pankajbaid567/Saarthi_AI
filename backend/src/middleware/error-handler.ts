import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/app-error.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  void _next;
  const statusCode = error instanceof AppError ? error.statusCode : 500;

  logger.error('Request failed', {
    message: error.message,
    statusCode,
    stack: error.stack,
  });

  res.status(statusCode).json({
    message: statusCode === 500 ? 'Internal server error' : error.message,
  });
};
