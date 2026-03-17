import Redis from 'ioredis';

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const redisClient = new Redis(env.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

redisClient.on('error', (error) => {
  logger.warn('Redis connection error', { message: error.message });
});
