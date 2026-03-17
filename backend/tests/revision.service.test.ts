import { describe, expect, it } from 'vitest';

import { KnowledgeGraphService } from '../src/services/knowledge-graph.service.js';
import { RevisionService } from '../src/services/revision.service.js';

describe('revision service', () => {
  it('computes retention using subject-aware forgetting curve and predicts future retention', () => {
    const knowledgeGraphService = new KnowledgeGraphService({ seedData: false });
    const subject = knowledgeGraphService.createSubject({ name: 'History' });
    const topic = knowledgeGraphService.createTopic({ subjectId: subject.id, name: 'Revolt of 1857' });
    const baseDate = new Date('2026-01-01T00:00:00.000Z');
    let now = new Date(baseDate);

    const revisionService = new RevisionService({
      knowledgeGraphService,
      nowProvider: () => now,
    });

    const initialRetention = revisionService.computeRetentionScore(topic.id, now, 'student-1');
    expect(initialRetention).toBe(100);

    now = new Date('2026-01-03T00:00:00.000Z');
    const decayedRetention = revisionService.computeRetentionScore(topic.id, now, 'student-1');
    expect(decayedRetention).toBeLessThan(100);

    const prediction = revisionService.predictRetention(topic.id, new Date('2026-01-10T00:00:00.000Z'), 'student-1');
    expect(prediction.topicId).toBe(topic.id);
    expect(prediction.retentionScore).toBeLessThan(decayedRetention);
  });

  it('adapts interval and ease factor based on recall quality', () => {
    const knowledgeGraphService = new KnowledgeGraphService({ seedData: false });
    const subject = knowledgeGraphService.createSubject({ name: 'Polity' });
    const topic = knowledgeGraphService.createTopic({ subjectId: subject.id, name: 'Parliament' });
    const baseDate = new Date('2026-01-01T00:00:00.000Z');
    let now = new Date(baseDate);

    const revisionService = new RevisionService({
      knowledgeGraphService,
      nowProvider: () => now,
    });

    const goodRecall = revisionService.submitReview('student-1', topic.id, 5);
    expect(goodRecall.intervalDays).toBeGreaterThan(1);
    expect(goodRecall.easeFactor).toBeGreaterThanOrEqual(2.5);

    now = new Date('2026-01-02T00:00:00.000Z');
    const weakRecall = revisionService.submitReview('student-1', topic.id, 1);
    expect(weakRecall.intervalDays).toBe(1);
    expect(weakRecall.easeFactor).toBeLessThan(goodRecall.easeFactor);
  });
});
