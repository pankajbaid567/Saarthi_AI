import dotenv from 'dotenv';

dotenv.config();

const parseOrigins = (value: string | undefined): string[] => {
  if (!value) {
    return ['http://localhost:3000'];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),
  corsOrigins: parseOrigins(process.env.CORS_ORIGINS),
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgresql://saarthi:saarthi@localhost:5432/saarthi_db?schema=public',
  mongodbUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/saarthi_db',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'replace-with-access-secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'replace-with-refresh-secret',
  accessTokenTtlSeconds: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900),
  refreshTokenTtlSeconds: Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 604800),
  emailVerificationTtlSeconds: Number(process.env.EMAIL_VERIFICATION_TTL_SECONDS ?? 86400),
  passwordResetTtlSeconds: Number(process.env.PASSWORD_RESET_TTL_SECONDS ?? 3600),
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL ?? '',
  pdfMaxFileSizeBytes: Number(process.env.PDF_MAX_FILE_SIZE_BYTES ?? 524288000),
  s3BucketName: process.env.S3_BUCKET_NAME ?? '',
  s3Region: process.env.S3_REGION ?? 'auto',
  s3Endpoint: process.env.S3_ENDPOINT ?? '',
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
  pdfQueueAttempts: Number(process.env.PDF_QUEUE_ATTEMPTS ?? 3),
  pdfQueueBackoffMs: Number(process.env.PDF_QUEUE_BACKOFF_MS ?? 1000),
  pdfBufferTtlMs: Number(process.env.PDF_BUFFER_TTL_MS ?? 900000),
  pdfInMemoryBufferLimitBytes: Number(process.env.PDF_IN_MEMORY_BUFFER_LIMIT_BYTES ?? 536870912),
  llmProvider: process.env.LLM_PROVIDER ?? 'mock',
  llmModel: process.env.LLM_MODEL ?? 'mock-llm',
  llmApiKey: process.env.LLM_API_KEY ?? '',
};
