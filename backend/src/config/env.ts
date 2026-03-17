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
};
