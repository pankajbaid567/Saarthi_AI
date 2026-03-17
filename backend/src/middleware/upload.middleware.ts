import type { RequestHandler } from 'express';
import multer from 'multer';

import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

export const createPdfUploadMiddleware = (): RequestHandler =>
  multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: env.pdfMaxFileSizeBytes,
    },
    fileFilter: (_req, file, callback) => {
      const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        callback(new AppError('Only PDF files are allowed', 400));
        return;
      }
      callback(null, true);
    },
  }).single('file');
