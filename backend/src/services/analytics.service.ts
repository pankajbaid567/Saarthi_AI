import { AppError } from '../errors/app-error.js';

export type TestQuestionAnalytics = {
  questionId: string;
  subject: string;
  topic: string;
  correctAnswer: string;
  finalAnswer: string | null;
  answerTrail: string[];
  isCorrect: boolean;
  timeSpentSeconds: number;
};

export type TestAnalyticsAttempt = {
  id: string;
  userId: string;
  responses: TestQuestionAnalytics[];
};

export type TopicAccuracy = {
  subject: string;
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
};

export type TimeBucket = {
  label: string;
  count: number;
};

export type ConceptGap = {
  subject: string;
  topic: string;
  wrongCount: number;
  total: number;
  accuracy: number;
};

export type TestAnalyticsResult = {
  testId: string;
  overall: {
    totalQuestions: number;
    attemptedQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedAnswers: number;
    accuracy: number;
  };
  accuracyByTopic: TopicAccuracy[];
  timeAnalysis: {
    averageSeconds: number;
    medianSeconds: number;
    distribution: TimeBucket[];
    questionTimes: Array<{ questionId: string; timeSpentSeconds: number }>;
  };
  sillyMistakes: Array<{
    questionId: string;
    subject: string;
    topic: string;
    changedFromCorrectToWrong: boolean;
  }>;
  guessingPatterns: {
    fastAnswerThresholdSeconds: number;
    veryFastAnswers: number;
    veryFastIncorrectAnswers: number;
    randomGuessingLikely: boolean;
  };
  conceptGaps: ConceptGap[];
};

export type AnalyticsAiInsights = {
  weaknessAnalysisPrompt: string;
  insights: string;
  weakAreas: string[];
  suggestedNextSteps: string[];
};

const toPercentage = (value: number): number => {
  return Number((value * 100).toFixed(2));
};

const average = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
};

const median = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    const lower = sorted[middle - 1] ?? 0;
    const upper = sorted[middle] ?? 0;
    return Number(((lower + upper) / 2).toFixed(2));
  }

  return sorted[middle] ?? 0;
};

export type AnalyticsServiceOptions = {
  attempts?: TestAnalyticsAttempt[];
  fastAnswerThresholdSeconds?: number;
};

export class AnalyticsService {
  private readonly attempts = new Map<string, TestAnalyticsAttempt>();

  private readonly fastAnswerThresholdSeconds: number;

  constructor(options: AnalyticsServiceOptions = {}) {
    this.fastAnswerThresholdSeconds = options.fastAnswerThresholdSeconds ?? 15;
    (options.attempts ?? []).forEach((attempt) => this.attempts.set(attempt.id, attempt));
  }

  getAttempt(testId: string): TestAnalyticsAttempt {
    const attempt = this.attempts.get(testId);
    if (!attempt) {
      throw new AppError('Test not found', 404);
    }

    return attempt;
  }

  getAnalytics(testId: string, userId: string): TestAnalyticsResult {
    const attempt = this.getAttempt(testId);
    if (attempt.userId !== userId) {
      throw new AppError('Test not found', 404);
    }

    const totalQuestions = attempt.responses.length;
    const attemptedQuestions = attempt.responses.filter((item) => item.finalAnswer !== null).length;
    const correctAnswers = attempt.responses.filter((item) => item.isCorrect).length;
    const incorrectAnswers = attempt.responses.filter((item) => item.finalAnswer !== null && !item.isCorrect).length;
    const skippedAnswers = totalQuestions - attemptedQuestions;

    const grouped = new Map<string, { subject: string; topic: string; correct: number; total: number }>();
    attempt.responses.forEach((response) => {
      const key = `${response.subject}::${response.topic}`;
      const current = grouped.get(key) ?? { subject: response.subject, topic: response.topic, correct: 0, total: 0 };
      current.total += 1;
      if (response.isCorrect) {
        current.correct += 1;
      }
      grouped.set(key, current);
    });

    const accuracyByTopic = [...grouped.values()]
      .map((item) => ({
        ...item,
        accuracy: item.total === 0 ? 0 : toPercentage(item.correct / item.total),
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    const times = attempt.responses.map((item) => item.timeSpentSeconds);
    const distribution: TimeBucket[] = [
      { label: '0-15s', count: 0 },
      { label: '16-30s', count: 0 },
      { label: '31-60s', count: 0 },
      { label: '61s+', count: 0 },
    ];

    attempt.responses.forEach((item) => {
      if (item.timeSpentSeconds <= 15) {
        distribution[0]!.count += 1;
      } else if (item.timeSpentSeconds <= 30) {
        distribution[1]!.count += 1;
      } else if (item.timeSpentSeconds <= 60) {
        distribution[2]!.count += 1;
      } else {
        distribution[3]!.count += 1;
      }
    });

    const sillyMistakes = attempt.responses
      .filter(
        (response) =>
          !response.isCorrect &&
          response.answerTrail.length > 1 &&
          response.answerTrail.slice(0, -1).includes(response.correctAnswer),
      )
      .map((response) => ({
        questionId: response.questionId,
        subject: response.subject,
        topic: response.topic,
        changedFromCorrectToWrong: true,
      }));

    const veryFastAnswers = attempt.responses.filter((item) => item.timeSpentSeconds <= this.fastAnswerThresholdSeconds);
    const veryFastIncorrectAnswers = veryFastAnswers.filter((item) => !item.isCorrect);
    const randomGuessingLikely =
      veryFastAnswers.length > 0 && veryFastIncorrectAnswers.length / veryFastAnswers.length >= 0.6;

    const conceptGaps = accuracyByTopic
      .filter((item) => item.correct < item.total)
      .map((item) => ({
        subject: item.subject,
        topic: item.topic,
        wrongCount: item.total - item.correct,
        total: item.total,
        accuracy: item.accuracy,
      }));

    return {
      testId,
      overall: {
        totalQuestions,
        attemptedQuestions,
        correctAnswers,
        incorrectAnswers,
        skippedAnswers,
        accuracy: totalQuestions === 0 ? 0 : toPercentage(correctAnswers / totalQuestions),
      },
      accuracyByTopic,
      timeAnalysis: {
        averageSeconds: average(times),
        medianSeconds: median(times),
        distribution,
        questionTimes: attempt.responses.map((item) => ({
          questionId: item.questionId,
          timeSpentSeconds: item.timeSpentSeconds,
        })),
      },
      sillyMistakes,
      guessingPatterns: {
        fastAnswerThresholdSeconds: this.fastAnswerThresholdSeconds,
        veryFastAnswers: veryFastAnswers.length,
        veryFastIncorrectAnswers: veryFastIncorrectAnswers.length,
        randomGuessingLikely,
      },
      conceptGaps,
    };
  }

  generateAiInsights(analytics: TestAnalyticsResult): AnalyticsAiInsights {
    const weakestTopics = analytics.accuracyByTopic.filter((item) => item.accuracy < 60).slice(0, 3);
    const weakAreas = weakestTopics.map((item) => `${item.subject} — ${item.topic}`);
    const suggestedNextSteps = weakAreas.map((area) => `Revise ${area} with targeted practice sets.`);

    const weaknessAnalysisPrompt = [
      'You are an UPSC exam coach.',
      `Analyze weaknesses for test ${analytics.testId}.`,
      `Overall accuracy: ${analytics.overall.accuracy}%.`,
      `Silly mistakes: ${analytics.sillyMistakes.length}.`,
      `Random guessing likely: ${analytics.guessingPatterns.randomGuessingLikely}.`,
      `Concept gaps: ${analytics.conceptGaps.map((gap) => `${gap.topic} (${gap.accuracy}%)`).join(', ') || 'none'}.`,
      'Return concise guidance with priorities and actionable next steps.',
    ].join(' ');

    const insights =
      weakAreas.length === 0
        ? 'Great consistency across topics. Continue timed practice to sustain speed and accuracy.'
        : `Performance indicates gaps in ${weakAreas.join(', ')}. Prioritize concept revision first, then solve timed question sets to reduce repeat errors.`;

    return {
      weaknessAnalysisPrompt,
      insights,
      weakAreas,
      suggestedNextSteps,
    };
  }
}

const defaultAnalyticsService = new AnalyticsService();

export const createAnalyticsService = (options: AnalyticsServiceOptions = {}): AnalyticsService => {
  if (Object.keys(options).length === 0) {
    return defaultAnalyticsService;
  }

  return new AnalyticsService(options);
};
