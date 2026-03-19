import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectMongo } from './lib/mongoose.js';
import { redisClient } from './lib/redis.js';
import { logger } from './utils/logger.js';
import { initSentry } from './utils/sentry.js';

// Initialize APM & Error Tracking
initSentry();

const app = createApp();

void connectMongo();
void redisClient.connect().catch((error) => {
  logger.warn('Redis not reachable at startup', { message: error.message });
});

app.listen(env.port, () => {
  logger.info(`Backend server running on port ${env.port}`);
});
