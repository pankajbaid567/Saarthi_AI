import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { createPdfUploadMiddleware } from '../middleware/upload.middleware.js';
import { validateRequest } from '../middleware/request-validation.js';
import { pdfIdSchema } from '../schemas/pdf.schema.js';
import { createPdfService, type PdfService } from '../services/pdf.service.js';

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

type CreatePdfRouterOptions = {
  pdfService?: PdfService;
};

export const createPdfRouter = (options: CreatePdfRouterOptions = {}): Router => {
  const router = Router();
  const pdfService = options.pdfService ?? createPdfService();
  const uploadPdf = createPdfUploadMiddleware();

  router.post(
    '/pdf/upload',
    authRateLimiter,
    authMiddleware,
    (req, res, next) => {
      uploadPdf(req, res, next);
    },
    asyncHandler(async (req, res) => {
      if (!req.file) {
        res.status(400).json({ message: 'PDF file is required' });
        return;
      }
      if (!req.file.buffer.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
        res.status(400).json({ message: 'Invalid PDF file signature' });
        return;
      }

      const document = await pdfService.upload(req.authUser!.userId, {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer,
      });
      res.status(202).json(document);
    }),
  );

  router.get(
    '/pdf/:id/status',
    authRateLimiter,
    authMiddleware,
    validateRequest(pdfIdSchema),
    asyncHandler(async (req, res) => {
      const status = await pdfService.getStatus(req.authUser!.userId, req.params.id);
      res.status(200).json(status);
    }),
  );

  router.get(
    '/pdf/:id/status/stream',
    authRateLimiter,
    authMiddleware,
    validateRequest(pdfIdSchema),
    asyncHandler(async (req, res) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const writeStatus = (payload: unknown): void => {
        try {
          res.write(`data: ${JSON.stringify(payload)}\n\n`);
        } catch {
          res.write('event: error\ndata: {"message":"Unable to stream status payload"}\n\n');
        }
      };

      const current = await pdfService.getStatus(req.authUser!.userId, req.params.id);
      writeStatus(current);

      const unsubscribe = pdfService.subscribe(req.params.id, (status) => {
        writeStatus(status);
      });

      req.on('close', () => {
        unsubscribe();
      });
    }),
  );

  router.get(
    '/pdfs',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      const documents = await pdfService.list(req.authUser!.userId);
      res.status(200).json(documents);
    }),
  );

  return router;
};
