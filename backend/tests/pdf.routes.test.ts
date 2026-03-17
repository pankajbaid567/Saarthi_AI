import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createPdfRouter } from '../src/routes/pdf.routes.js';
import type {
  PdfExtractorService,
  ExtractPdfResult,
} from '../src/services/pdf-extractor.service.js';
import type { PdfProcessingQueueService } from '../src/services/pdf-processing-queue.service.js';
import { PdfService } from '../src/services/pdf.service.js';
import type { StorageService } from '../src/services/storage.service.js';

const issueAccessToken = (): string => {
  return jwt.sign(
    {
      sub: 'student-user-id',
      role: 'student',
      email: 'student@example.com',
    },
    env.jwtAccessSecret,
    {
      expiresIn: env.accessTokenTtlSeconds,
    },
  );
};

class InlineQueueService implements PdfProcessingQueueService {
  constructor(private readonly processor: (pdfDocumentId: string) => Promise<void>) {}

  async enqueue(pdfDocumentId: string): Promise<void> {
    await this.processor(pdfDocumentId);
  }
}

class MockStorageService implements StorageService {
  async upload(): Promise<{ key: string }> {
    return { key: 'pdfs/uploaded.pdf' };
  }
}

class MockExtractorService implements PdfExtractorService {
  async extract(): Promise<ExtractPdfResult> {
    return {
      pages: [
        {
          pageNumber: 1,
          text: 'Extracted page text',
          tables: [],
        },
      ],
      fullText: 'Extracted page text',
      usedOcr: false,
    };
  }
}

const createTestApp = () => {
  const holder: { service?: PdfService } = {};
  const pdfService = new PdfService({
    storageService: new MockStorageService(),
    extractorService: new MockExtractorService(),
    queueService: new InlineQueueService(async (id) => {
      await holder.service!.processDocument(id);
    }),
  });
  holder.service = pdfService;

  const app = express();
  app.use('/api/v1', createPdfRouter({ pdfService }));
  app.use(errorHandler);
  return app;
};

describe('pdf routes', () => {
  it('supports upload, status lookup and list endpoints', async () => {
    const app = createTestApp();
    const token = issueAccessToken();
    const pdfBuffer = Buffer.from('%PDF-1.4 fake content');

    const uploadResponse = await request(app)
      .post('/api/v1/pdf/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', pdfBuffer, {
        filename: 'sample.pdf',
        contentType: 'application/pdf',
      });

    expect(uploadResponse.status).toBe(202);
    expect(uploadResponse.body.status).toBe('queued');

    const statusResponse = await request(app)
      .get(`/api/v1/pdf/${uploadResponse.body.id}/status`)
      .set('Authorization', `Bearer ${token}`);

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.totalPages).toBe(1);

    const listResponse = await request(app).get('/api/v1/pdfs').set('Authorization', `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body).toHaveLength(1);
  });

  it('rejects non-pdf uploads', async () => {
    const app = createTestApp();
    const token = issueAccessToken();

    const response = await request(app)
      .post('/api/v1/pdf/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('plain text'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Only PDF');
  });
});
