import { describe, expect, it } from 'vitest';

import { AnalyticsService, type TestAnalyticsAttempt } from '../src/services/analytics.service.js';

const attempt: TestAnalyticsAttempt = {
  id: '11111111-1111-4111-8111-111111111111',
  userId: 'student-1',
  responses: [
    {
      questionId: 'q-1',
      subject: 'Polity',
      topic: 'Fundamental Rights',
      correctAnswer: 'B',
      finalAnswer: 'C',
      answerTrail: ['B', 'C'],
      isCorrect: false,
      timeSpentSeconds: 10,
    },
    {
      questionId: 'q-2',
      subject: 'Polity',
      topic: 'Fundamental Rights',
      correctAnswer: 'A',
      finalAnswer: 'A',
      answerTrail: ['A'],
      isCorrect: true,
      timeSpentSeconds: 45,
    },
    {
      questionId: 'q-3',
      subject: 'History',
      topic: 'Medieval India',
      correctAnswer: 'D',
      finalAnswer: 'A',
      answerTrail: ['A'],
      isCorrect: false,
      timeSpentSeconds: 12,
    },
    {
      questionId: 'q-4',
      subject: 'History',
      topic: 'Medieval India',
      correctAnswer: 'C',
      finalAnswer: null,
      answerTrail: [],
      isCorrect: false,
      timeSpentSeconds: 18,
    },
  ],
};

describe('analytics service', () => {
  it('calculates topic accuracy, time analysis, silly mistakes, guessing patterns, and AI insights', () => {
    const analyticsService = new AnalyticsService({ attempts: [attempt], fastAnswerThresholdSeconds: 15 });

    const analytics = analyticsService.getAnalytics(attempt.id, attempt.userId);
    const ai = analyticsService.generateAiInsights(analytics);

    expect(analytics.overall.totalQuestions).toBe(4);
    expect(analytics.overall.correctAnswers).toBe(1);
    expect(analytics.overall.incorrectAnswers).toBe(2);
    expect(analytics.overall.skippedAnswers).toBe(1);

    expect(analytics.accuracyByTopic).toHaveLength(2);
    expect(analytics.timeAnalysis.distribution.map((item) => item.count)).toEqual([2, 1, 1, 0]);

    expect(analytics.sillyMistakes).toEqual([
      expect.objectContaining({ questionId: 'q-1', changedFromCorrectToWrong: true }),
    ]);

    expect(analytics.guessingPatterns.veryFastAnswers).toBe(2);
    expect(analytics.guessingPatterns.veryFastIncorrectAnswers).toBe(2);
    expect(analytics.guessingPatterns.randomGuessingLikely).toBe(true);

    expect(analytics.conceptGaps.length).toBeGreaterThan(0);
    expect(ai.weaknessAnalysisPrompt).toContain('UPSC exam coach');
    expect(ai.insights.length).toBeGreaterThan(0);
    expect(ai.suggestedNextSteps.length).toBeGreaterThan(0);
  });
});
