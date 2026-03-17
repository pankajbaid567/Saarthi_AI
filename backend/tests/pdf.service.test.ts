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
          text: 'CONSTITUTION NOTES\nArticle 14 guarantees equality before law.',
          tables: [],
        },
        {
          pageNumber: 2,
          text: 'What is Article 14?\nA) Equality before law\nB) Right to life\nC) Freedom of speech\nD) Right against exploitation\nCorrect Answer: A\nExplanation: Article 14 ensures equality.',
          tables: ['| Question | Option |'],
        },
      ],
      fullText:
        'CONSTITUTION NOTES\nArticle 14 guarantees equality before law.\n\nWhat is Article 14?\nA) Equality before law\nB) Right to life\nC) Freedom of speech\nD) Right against exploitation\nCorrect Answer: A\nExplanation: Article 14 ensures equality.\n\nExplain the impact of the 42nd Amendment (15 marks).',
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

    const extracted = await service.getExtracted('user-1', document.id);
    expect(extracted.structure.headings.length).toBeGreaterThan(0);
    expect(extracted.structure.headings[0]).toMatchObject({ level: 1, title: 'CONSTITUTION NOTES' });
    expect(extracted.mcqs[0]?.correctAnswer).toBe('A');
    expect(extracted.mainsQuestions[0]?.marks).toBe(15);
    expect(extracted.keyFacts.constitutionalArticles).toContain('Article 14');
  });
});
