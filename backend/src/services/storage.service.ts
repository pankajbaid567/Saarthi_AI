import { randomUUID } from 'crypto';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

export type StorageUploadInput = {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
};

export type StorageUploadResult = {
  key: string;
};

export interface StorageService {
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
}

const buildObjectKey = (fileName: string): string => {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
  return `pdfs/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeName}`;
};

export class S3StorageService implements StorageService {
  private readonly client = new S3Client({
    region: env.s3Region,
    endpoint: env.s3Endpoint || undefined,
    forcePathStyle: true,
    credentials:
      env.s3AccessKeyId && env.s3SecretAccessKey
        ? {
            accessKeyId: env.s3AccessKeyId,
            secretAccessKey: env.s3SecretAccessKey,
          }
        : undefined,
  });

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    if (!env.s3BucketName || !env.s3Endpoint || !env.s3AccessKeyId || !env.s3SecretAccessKey) {
      throw new AppError('S3/R2 storage configuration is missing', 500);
    }

    const key = buildObjectKey(input.fileName);
    await this.client.send(
      new PutObjectCommand({
        Bucket: env.s3BucketName,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType,
      }),
    );

    return { key };
  }
}

export const createStorageService = (): StorageService => new S3StorageService();
