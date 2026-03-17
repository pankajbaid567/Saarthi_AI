import { Queue, Worker } from 'bullmq';

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

type PdfProcessingJobData = {
  pdfDocumentId: string;
};

export interface PdfProcessingQueueService {
  enqueue(pdfDocumentId: string): Promise<void>;
}

type PdfProcessingQueueServiceOptions = {
  processor: (pdfDocumentId: string) => Promise<void>;
};

class InMemoryPdfProcessingQueueService implements PdfProcessingQueueService {
  constructor(private readonly processor: (pdfDocumentId: string) => Promise<void>) {}

  async enqueue(pdfDocumentId: string): Promise<void> {
    for (let attempt = 1; attempt <= env.pdfQueueAttempts; attempt += 1) {
      try {
        await this.processor(pdfDocumentId);
        return;
      } catch (error) {
        if (attempt === env.pdfQueueAttempts) {
          throw error;
        }

        await new Promise((resolve) => {
          setTimeout(resolve, env.pdfQueueBackoffMs);
        });
      }
    }
  }
}

class BullMqPdfProcessingQueueService implements PdfProcessingQueueService {
  private readonly connection = (() => {
    const redisUrl = new URL(env.redisUrl);
    const db = redisUrl.pathname ? Number(redisUrl.pathname.replace('/', '')) : undefined;

    return {
      host: redisUrl.hostname,
      port: Number(redisUrl.port || 6379),
      username: redisUrl.username || undefined,
      password: redisUrl.password || undefined,
      db: Number.isNaN(db) ? undefined : db,
      maxRetriesPerRequest: null,
    };
  })();

  private readonly queue: Queue;

  private readonly worker: Worker;

  constructor(processor: (pdfDocumentId: string) => Promise<void>) {
    this.queue = new Queue('pdf-extraction', {
      connection: this.connection,
    });

    this.worker = new Worker(
      'pdf-extraction',
      async (job) => {
        const data = job.data as PdfProcessingJobData;
        await processor(data.pdfDocumentId);
      },
      {
        connection: this.connection,
      },
    );

    this.worker.on('error', (error) => {
      logger.warn('PDF worker error; processing will fallback to retries in queue', {
        message: error.message,
      });
    });
  }

  async enqueue(pdfDocumentId: string): Promise<void> {
    await this.queue.add(
      'extract-job',
      { pdfDocumentId },
      {
        attempts: env.pdfQueueAttempts,
        backoff: {
          type: 'fixed',
          delay: env.pdfQueueBackoffMs,
        },
        removeOnComplete: true,
      },
    );
  }
}

export const createPdfProcessingQueueService = (
  options: PdfProcessingQueueServiceOptions,
): PdfProcessingQueueService => {
  try {
    return new BullMqPdfProcessingQueueService(options.processor);
  } catch (error) {
    logger.warn('BullMQ unavailable, using in-memory PDF queue fallback', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return new InMemoryPdfProcessingQueueService(options.processor);
  }
};
