import { describe, expect, it } from 'vitest';

import { KnowledgeGraphService } from '../src/services/knowledge-graph.service.js';
import { TestEngineService } from '../src/services/test-engine.service.js';

describe('test engine service', () => {
  it('generates tests across all required modes and scores with negative marking', async () => {
    const knowledgeGraphService = new KnowledgeGraphService({ seedData: false });
    const subject = knowledgeGraphService.createSubject({ name: 'Polity' });
    const topic = knowledgeGraphService.createTopic({ subjectId: subject.id, name: 'Fundamental Rights' });
    const subtopic = knowledgeGraphService.createTopic({
      subjectId: subject.id,
      parentTopicId: topic.id,
      name: 'Article 14',
    });

    const testEngineService = new TestEngineService({ knowledgeGraphService });

    const topicWiseTest = await testEngineService.generateTest('user-1', {
      type: 'topic_wise',
      topicIds: [topic.id],
      questionCount: 3,
      timeLimitMinutes: 10,
    });
    expect(topicWiseTest.questions).toHaveLength(3);
    expect(topicWiseTest.questions.every((question) => question.topicId === topic.id)).toBe(true);

    const subtopicTest = await testEngineService.generateTest('user-1', {
      type: 'subtopic_wise',
      topicIds: [subtopic.id],
      questionCount: 2,
    });
    expect(subtopicTest.questions.every((question) => question.topicId === subtopic.id)).toBe(true);

    const mixedTest = await testEngineService.generateTest('user-1', {
      type: 'mixed',
      questionCount: 4,
    });
    expect(mixedTest.questions).toHaveLength(4);

    const pyqTest = await testEngineService.generateTest('user-1', {
      type: 'pyq',
      questionCount: 2,
    });
    expect(pyqTest.questions.every((question) => question.type === 'pyq')).toBe(true);

    const customTest = await testEngineService.generateTest('user-1', {
      type: 'custom',
      topicIds: [topic.id, subtopic.id],
      questionCount: 4,
    });
    expect(customTest.questions).toHaveLength(4);

    const firstQuestion = topicWiseTest.questions[0]!;
    const secondQuestion = topicWiseTest.questions[1]!;
    const submitResult = await testEngineService.submitTest('user-1', topicWiseTest.testId, [
      {
        questionId: firstQuestion.id,
        selectedOption: 'A',
        timeTakenSeconds: 40,
      },
      {
        questionId: secondQuestion.id,
        selectedOption: 'D',
        timeTakenSeconds: 20,
        isFlagged: true,
      },
    ]);

    expect(submitResult.negativeMarks).toBeGreaterThanOrEqual(0);
    expect(submitResult.score).toBeLessThanOrEqual(submitResult.totalMarks);

    const results = testEngineService.getResults('user-1', topicWiseTest.testId);
    expect(results.questions).toHaveLength(3);
    expect(results.negativeMarks).toBe(submitResult.negativeMarks);

    const weakAreaTest = await testEngineService.generateTest('user-1', {
      type: 'weak_area',
      questionCount: 2,
    });
    expect(weakAreaTest.questions).toHaveLength(2);
  });
});
