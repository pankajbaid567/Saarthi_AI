import { EventEmitter } from 'events';
import mongoose from 'mongoose';
import { randomUUID } from 'crypto';

import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { PdfExtractedTextModel } from '../models/pdf-extracted-text.model.js';
import { logger } from '../utils/logger.js';
import {
  createPdfContentClassifierService,
  type PdfContentClassifierService,
  type PdfExtractedContent,
} from './pdf-content-classifier.service.js';
import {
  createPdfExtractorService,
  type ExtractedPdfPage,
  type PdfExtractorService,
} from './pdf-extractor.service.js';
import {
  createPdfProcessingQueueService,
  type PdfProcessingQueueService,
} from './pdf-processing-queue.service.js';
import { createStorageService, type StorageService } from './storage.service.js';

export type PdfDocumentStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type PdfDocument = {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageKey: string;
  status: PdfDocumentStatus;
  pagesProcessed: number;
  totalPages: number;
  createdAt: Date;
  updatedAt: Date;
  errorMessage: string | null;
};

type CreatePdfDocumentInput = Omit<PdfDocument, 'id' | 'createdAt' | 'updatedAt'>;

type PersistExtractedTextInput = {
  pdfDocumentId: string;
  fullText: string;
  pages: ExtractedPdfPage[];
  usedOcr: boolean;
  extractedContent: PdfExtractedContent;
};

export interface PdfDocumentRepository {
  create(input: CreatePdfDocumentInput): Promise<PdfDocument>;
  update(id: string, update: Partial<PdfDocument>): Promise<PdfDocument>;
  getById(id: string): Promise<PdfDocument | null>;
  listByUser(userId: string): Promise<PdfDocument[]>;
}

export interface PdfExtractedTextRepository {
  upsert(input: PersistExtractedTextInput): Promise<void>;
  getByPdfDocumentId(pdfDocumentId: string): Promise<PersistExtractedTextInput | null>;
}

class InMemoryPdfDocumentRepository implements PdfDocumentRepository {
  private readonly documents = new Map<string, PdfDocument>();

  async create(input: CreatePdfDocumentInput): Promise<PdfDocument> {
    const now = new Date();
    const document: PdfDocument = {
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      ...input,
    };

    this.documents.set(document.id, document);
    return document;
  }

  async update(id: string, update: Partial<PdfDocument>): Promise<PdfDocument> {
    const current = this.documents.get(id);
    if (!current) {
      throw new AppError('PDF document not found', 404);
    }

    const updated: PdfDocument = {
      ...current,
      ...update,
      id: current.id,
      updatedAt: new Date(),
    };

    this.documents.set(id, updated);
    return updated;
  }

  async getById(id: string): Promise<PdfDocument | null> {
    return this.documents.get(id) ?? null;
  }

  async listByUser(userId: string): Promise<PdfDocument[]> {
    return [...this.documents.values()]
      .filter((document) => document.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

class MongoBackedPdfExtractedTextRepository implements PdfExtractedTextRepository {
  private readonly fallback = new Map<string, PersistExtractedTextInput>();

  async upsert(input: PersistExtractedTextInput): Promise<void> {
    this.fallback.set(input.pdfDocumentId, input);

    if (mongoose.connection.readyState !== 1) {
      return;
    }

    await PdfExtractedTextModel.findOneAndUpdate(
      { pdfDocumentId: input.pdfDocumentId },
      {
        $set: {
          fullText: input.fullText,
          pages: input.pages,
          usedOcr: input.usedOcr,
          extractedContent: input.extractedContent,
        },
      },
      { upsert: true },
    ).exec();
  }

  async getByPdfDocumentId(pdfDocumentId: string): Promise<PersistExtractedTextInput | null> {
    const fromFallback = this.fallback.get(pdfDocumentId);
    if (fromFallback) {
      return fromFallback;
    }

    if (mongoose.connection.readyState !== 1) {
      return null;
    }

    const stored = await PdfExtractedTextModel.findOne({ pdfDocumentId }).lean().exec();
    if (!stored) {
      return null;
    }

    return {
      pdfDocumentId: stored.pdfDocumentId,
      fullText: stored.fullText,
      pages: stored.pages as ExtractedPdfPage[],
      usedOcr: stored.usedOcr,
      extractedContent: stored.extractedContent as PdfExtractedContent,
    };
  }
}

export type PdfUploadInput = {
  originalName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
};

type PdfServiceOptions = {
  storageService?: StorageService;
  queueService?: PdfProcessingQueueService;
  extractorService?: PdfExtractorService;
  classifierService?: PdfContentClassifierService;
  documentRepository?: PdfDocumentRepository;
  extractedTextRepository?: PdfExtractedTextRepository;
};

export class PdfService {
  private readonly statusEvents = new EventEmitter();

  private readonly storageService: StorageService;

  private readonly extractorService: PdfExtractorService;

  private readonly classifierService: PdfContentClassifierService;

  private readonly documentRepository: PdfDocumentRepository;

  private readonly extractedTextRepository: PdfExtractedTextRepository;

  private readonly queueService: PdfProcessingQueueService;

  private readonly buffers = new Map<string, { buffer: Buffer; size: number; timeout: NodeJS.Timeout }>();

  private bufferedBytes = 0;

  constructor(options: PdfServiceOptions = {}) {
    this.storageService = options.storageService ?? createStorageService();
    this.extractorService = options.extractorService ?? createPdfExtractorService();
    this.classifierService = options.classifierService ?? createPdfContentClassifierService();
    this.documentRepository = options.documentRepository ?? new InMemoryPdfDocumentRepository();
    this.extractedTextRepository = options.extractedTextRepository ?? new MongoBackedPdfExtractedTextRepository();
    this.queueService =
      options.queueService ??
      createPdfProcessingQueueService({
        processor: async (pdfDocumentId) => this.processDocument(pdfDocumentId),
      });
  }

  async upload(userId: string, input: PdfUploadInput): Promise<PdfDocument> {
    if (input.mimeType !== 'application/pdf') {
      throw new AppError('Only PDF uploads are supported', 400);
    }

    if (this.bufferedBytes + input.size > env.pdfInMemoryBufferLimitBytes) {
      throw new AppError('PDF processing queue is at capacity, please retry shortly', 503);
    }

    const stored = await this.storageService.upload({
      fileName: input.originalName,
      mimeType: input.mimeType,
      buffer: input.buffer,
    });

    const document = await this.documentRepository.create({
      userId,
      fileName: input.originalName,
      fileSize: input.size,
      mimeType: input.mimeType,
      storageKey: stored.key,
      status: 'queued',
      pagesProcessed: 0,
      totalPages: 0,
      errorMessage: null,
    });

    const timeout = setTimeout(() => {
      this.releaseBuffer(document.id);
    }, env.pdfBufferTtlMs);
    this.buffers.set(document.id, {
      buffer: input.buffer,
      size: input.size,
      timeout,
    });
    this.bufferedBytes += input.size;
    await this.queueService.enqueue(document.id);
    return document;
  }

  async getStatus(userId: string, id: string): Promise<PdfDocument> {
    const document = await this.documentRepository.getById(id);
    if (!document || document.userId !== userId) {
      throw new AppError('PDF document not found', 404);
    }

    return document;
  }

  async list(userId: string): Promise<PdfDocument[]> {
    return this.documentRepository.listByUser(userId);
  }

  async getExtracted(userId: string, id: string): Promise<PdfExtractedContent> {
    const document = await this.documentRepository.getById(id);
    if (!document || document.userId !== userId) {
      throw new AppError('PDF document not found', 404);
    }

    const extracted = await this.extractedTextRepository.getByPdfDocumentId(id);
    if (!extracted) {
      throw new AppError('Extracted PDF content not found', 404);
    }

    return extracted.extractedContent;
  }

  subscribe(id: string, listener: (document: PdfDocument) => void): () => void {
    this.statusEvents.on(id, listener);
    return () => {
      this.statusEvents.off(id, listener);
    };
  }

  async processDocument(pdfDocumentId: string): Promise<void> {
    const document = await this.documentRepository.getById(pdfDocumentId);
    if (!document) {
      throw new AppError('PDF document not found', 404);
    }

    await this.pushStatus(pdfDocumentId, {
      status: 'processing',
      pagesProcessed: 0,
      totalPages: 0,
      errorMessage: null,
    });

    const source = this.buffers.get(pdfDocumentId);
    if (!source) {
      await this.pushStatus(pdfDocumentId, {
        status: 'failed',
        errorMessage: 'Uploaded PDF data is unavailable for processing',
      });
      return;
    }

    try {
      const extracted = await this.extractorService.extract(source.buffer);
      const extractedContent = this.classifierService.classify(extracted.fullText, extracted.pages);
      const totalPages = extracted.pages.length;
      await this.pushStatus(pdfDocumentId, { totalPages, pagesProcessed: 0 });

      for (let index = 0; index < totalPages; index += 1) {
        await this.pushStatus(pdfDocumentId, { pagesProcessed: index + 1 });
      }

      await this.extractedTextRepository.upsert({
        pdfDocumentId,
        fullText: extracted.fullText,
        pages: extracted.pages,
        usedOcr: extracted.usedOcr,
        extractedContent,
      });

      await this.pushStatus(pdfDocumentId, {
        status: 'completed',
        pagesProcessed: totalPages,
        totalPages,
      });
    } catch (error) {
      await this.pushStatus(pdfDocumentId, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Failed to extract PDF text',
      });
      logger.error('PDF extraction failed', {
        pdfDocumentId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      this.releaseBuffer(pdfDocumentId);
    }
  }

  private async pushStatus(pdfDocumentId: string, update: Partial<PdfDocument>): Promise<void> {
    const nextDocument = await this.documentRepository.update(pdfDocumentId, update);
    this.statusEvents.emit(pdfDocumentId, nextDocument);
  }

  private releaseBuffer(pdfDocumentId: string): void {
    const buffered = this.buffers.get(pdfDocumentId);
    if (!buffered) {
      return;
    }

    clearTimeout(buffered.timeout);
    this.bufferedBytes = Math.max(0, this.bufferedBytes - buffered.size);
    this.buffers.delete(pdfDocumentId);
  }
}

let defaultPdfService: PdfService | null = null;

export const createPdfService = (options: PdfServiceOptions = {}): PdfService => {
  if (Object.keys(options).length > 0) {
    return new PdfService(options);
  }

  if (!defaultPdfService) {
    defaultPdfService = new PdfService();
  }

  return defaultPdfService;
};
