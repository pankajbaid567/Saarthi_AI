import { env } from '../config/env.js';
import { redisClient } from './redis.js';

export const cacheTtlSeconds = {
  subjectTopicHierarchy: 60 * 60,
  popularMcqs: 30 * 60,
  userPerformanceStats: 5 * 60,
  retentionScores: 10 * 60,
  syllabusProgress: 15 * 60,
  dailyPracticeQueue: 24 * 60 * 60,
} as const;

export const cacheKeys = {
  subjectTopicHierarchy: (subjectId?: string) =>
    subjectId ? `week24:subjects:${subjectId}:topic-hierarchy` : 'week24:subjects:topic-hierarchy',
  popularMcqs: (subjectId?: string) => (subjectId ? `week24:mcqs:popular:${subjectId}` : 'week24:mcqs:popular'),
  userPerformanceStats: (userId: string) => `week24:performance:${userId}:stats`,
  userPerformancePredictions: (userId: string) => `week24:performance:${userId}:predictions`,
  userPerformanceWeakAreas: (userId: string) => `week24:performance:${userId}:weak-areas`,
  retentionScores: (userId: string) => `week24:revision:${userId}:retention-scores`,
  syllabusProgress: (userId: string, subjectId?: string) =>
    `week24:syllabus:${userId}:progress:${subjectId ?? 'all'}`,
  dailyPracticeQueue: (userId: string) => `week24:practice:${userId}:daily-queue`,
} as const;

const cacheEnabled = env.nodeEnv !== 'test';

export const getCachedJson = async <T>(key: string): Promise<T | null> => {
  if (!cacheEnabled) {
    return null;
  }

  try {
    const value = await redisClient.get(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
};

export const setCachedJson = async <T>(key: string, value: T, ttlSeconds: number): Promise<void> => {
  if (!cacheEnabled) {
    return;
  }

  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // fail open: cache should never break API responses
  }
};
