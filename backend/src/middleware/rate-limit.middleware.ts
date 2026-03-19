import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';

import { env } from '../config/env.js';
import { redisClient } from '../lib/redis.js';

const createRateLimitStore = () => {
  if (env.nodeEnv === 'test') {
    return undefined;
  }

  return new RedisStore({
    sendCommand: async (...args: string[]) => {
      const [command, ...commandArgs] = args;
      return redisClient.call(command, ...commandArgs) as Promise<number>;
    },
  });
};

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createRateLimitStore(),
  message: {
    message: 'Too many authentication requests, please try again later.',
  },
});

export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
  passOnStoreError: true,
  store: createRateLimitStore(),
  message: {
    message: 'Too many requests from this IP, please try again later.',
  },
});
