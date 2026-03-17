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
