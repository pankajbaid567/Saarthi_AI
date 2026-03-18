import { describe, expect, it } from 'vitest';

import { KnowledgeGraphService } from '../src/services/knowledge-graph.service.js';
import { RevisionService } from '../src/services/revision.service.js';
import { StrategyService } from '../src/services/strategy.service.js';
import { SyllabusFlowService } from '../src/services/syllabus-flow.service.js';
import { TestEngineService } from '../src/services/test-engine.service.js';

describe('week 25 cross-module integration', () => {
  it('feeds NeuroRevise urgency into strategy generation', () => {
    const knowledgeGraphService = new KnowledgeGraphService({ seedData: false });
    const subject = knowledgeGraphService.createSubject({ name: 'History' });
    const topic = knowledgeGraphService.createTopic({ subjectId: subject.id, name: 'Civil Disobedience Movement' });
    let now = new Date('2026-01-01T00:00:00.000Z');
    const revisionService = new RevisionService({ knowledgeGraphService, nowProvider: () => now });
    const strategyService = new StrategyService();

    revisionService.submitReview('student-1', topic.id, 2);
    now = new Date('2026-01-03T00:00:00.000Z');
    const dueCards = revisionService.getDueCards('student-1');

    const generated = strategyService.generate('student-1', {
      retentionUrgencyCount: dueCards.length,
      weakAreas: [topic.name],
    });

    const revisionTask = generated.today.tasks.find((task) => task.type === 'revision');
    expect(dueCards.length).toBeGreaterThan(0);
    expect(revisionTask?.title).toContain('NeuroRevise');
  });

  it('keeps SyllabusFlow practice gated by completed topics while MCQ tests use selected topics', async () => {
    const knowledgeGraphService = new KnowledgeGraphService({ seedData: false });
    const subject = knowledgeGraphService.createSubject({ name: 'Polity' });
    const topic = knowledgeGraphService.createTopic({ subjectId: subject.id, name: 'Parliamentary Committees' });
    const syllabusFlowService = new SyllabusFlowService({ knowledgeGraphService });
    const testEngineService = new TestEngineService({ knowledgeGraphService });

    expect(() => syllabusFlowService.generateDailyPractice('student-1')).toThrow('completed');

    syllabusFlowService.updateTopicStatus('student-1', topic.id, { status: 'completed', timeSpentMinutes: 30 });
    const practiceQueue = syllabusFlowService.generateDailyPractice('student-1', { questionCount: 3 });
    expect(practiceQueue.questions).toHaveLength(3);
    expect(practiceQueue.questions.every((question) => question.topicId === topic.id)).toBe(true);

    const generatedTest = await testEngineService.generateTest('student-1', {
      type: 'topic_wise',
      topicIds: [topic.id],
      questionCount: 3,
      timeLimitMinutes: 10,
    });
    expect(generatedTest.questions.every((question) => question.topicId === topic.id)).toBe(true);
  });
});
