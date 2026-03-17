import mongoose from 'mongoose';

import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const connectMongo = async (): Promise<void> => {
  try {
    await mongoose.connect(env.mongodbUri);
    logger.info('MongoDB connection established');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('MongoDB connection failed', { message });
  }
};
