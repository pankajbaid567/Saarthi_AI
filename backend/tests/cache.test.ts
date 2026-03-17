import { describe, expect, it } from 'vitest';

import { cacheKeys, cacheTtlSeconds } from '../src/lib/cache.js';

describe('week 24 cache strategy', () => {
  it('defines required ttl values', () => {
    expect(cacheTtlSeconds.subjectTopicHierarchy).toBe(3600);
    expect(cacheTtlSeconds.popularMcqs).toBe(1800);
    expect(cacheTtlSeconds.userPerformanceStats).toBe(300);
    expect(cacheTtlSeconds.retentionScores).toBe(600);
    expect(cacheTtlSeconds.syllabusProgress).toBe(900);
    expect(cacheTtlSeconds.dailyPracticeQueue).toBe(86400);
  });

  it('builds stable cache keys', () => {
    expect(cacheKeys.subjectTopicHierarchy()).toBe('week24:subjects:topic-hierarchy');
    expect(cacheKeys.subjectTopicHierarchy('history')).toBe('week24:subjects:history:topic-hierarchy');
    expect(cacheKeys.popularMcqs('economy')).toBe('week24:mcqs:popular:economy');
    expect(cacheKeys.userPerformanceStats('user-1')).toBe('week24:performance:user-1:stats');
    expect(cacheKeys.retentionScores('user-1')).toBe('week24:revision:user-1:retention-scores');
    expect(cacheKeys.syllabusProgress('user-1', 'subject-1')).toBe('week24:syllabus:user-1:progress:subject-1');
    expect(cacheKeys.dailyPracticeQueue('user-1')).toBe('week24:practice:user-1:daily-queue');
  });
});
