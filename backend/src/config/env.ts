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
};
