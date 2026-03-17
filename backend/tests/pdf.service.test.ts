import { describe, expect, it } from 'vitest';

import type {
  PdfExtractorService,
  ExtractPdfResult,
} from '../src/services/pdf-extractor.service.js';
import type { PdfProcessingQueueService } from '../src/services/pdf-processing-queue.service.js';
import { PdfService } from '../src/services/pdf.service.js';
import type { StorageService } from '../src/services/storage.service.js';

class InlineQueueService implements PdfProcessingQueueService {
  constructor(private readonly processor: (pdfDocumentId: string) => Promise<void>) {}

  async enqueue(pdfDocumentId: string): Promise<void> {
    await this.processor(pdfDocumentId);
  }
}

class MockStorageService implements StorageService {
  async upload(): Promise<{ key: string }> {
    return { key: 'pdfs/mock.pdf' };
  }
}

class MockExtractorService implements PdfExtractorService {
  async extract(): Promise<ExtractPdfResult> {
    return {
      pages: [
        {
          pageNumber: 1,
          text: 'Page 1 text',
          tables: [],
        },
        {
          pageNumber: 2,
          text: 'Page 2 text | a | b | c',
          tables: ['Page 2 text | a | b | c'],
        },
      ],
      fullText: 'Page 1 text\nPage 2 text',
      usedOcr: false,
    };
  }
}

describe('pdf service', () => {
  it('uploads and processes PDF documents with progress tracking', async () => {
    const holder: { service?: PdfService } = {};
    const service = new PdfService({
      storageService: new MockStorageService(),
      extractorService: new MockExtractorService(),
      queueService: new InlineQueueService(async (id) => {
        await holder.service!.processDocument(id);
      }),
    });
    holder.service = service;

    const document = await service.upload('user-1', {
      originalName: 'notes.pdf',
      mimeType: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('%PDF-1.4 fake'),
    });

    const status = await service.getStatus('user-1', document.id);
    expect(status.status).toBe('completed');
    expect(status.totalPages).toBe(2);
    expect(status.pagesProcessed).toBe(2);

    const list = await service.list('user-1');
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(document.id);
  });
});
