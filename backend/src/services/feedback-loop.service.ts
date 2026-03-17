import { randomUUID } from 'crypto';

import { createTestEngineService, type TestEngineService } from './test-engine.service.js';

type PracticeAdaptationLog = {
  id: string;
  userId: string;
  topicId: string;
  previousDifficultyTier: number;
  adjustedDifficultyTier: number;
  weakAreaWeightMultiplier: number;
  reason: string;
  createdAt: Date;
};

type FeedbackLoopServiceOptions = {
  testEngineService?: TestEngineService;
};

const roundToTwo = (value: number): number => Number(value.toFixed(2));

export class FeedbackLoopService {
  private readonly testEngineService: TestEngineService;

  private readonly adaptationLogs: PracticeAdaptationLog[] = [];

  constructor(options: FeedbackLoopServiceOptions = {}) {
    this.testEngineService = options.testEngineService ?? createTestEngineService();
  }

  getFeedbackLoop(userId: string): {
    rollingWindowDays: number;
    topics: Array<{
      topicId: string;
      attemptedQuestions: number;
      accuracy: number;
      difficultyTierDelta: -1 | 0 | 1;
      weakAreaWeightMultiplier: number;
      reason: string;
    }>;
    loggedAdaptations: PracticeAdaptationLog[];
  } {
    const rollingWindowDays = 7;
    const topicPerformance = this.testEngineService.getRecentTopicPerformance(userId, rollingWindowDays);
    const topicAdaptations = topicPerformance.map((topic) => {
      const difficultyTierDelta = this.resolveDifficultyAdjustment(topic.accuracy);
      const weakAreaWeightMultiplier = topic.accuracy < 60 ? 1.35 : 1;
      const reason =
        difficultyTierDelta === -1
          ? 'Accuracy dropped below 50%; easing difficulty and prioritizing topic.'
          : difficultyTierDelta === 1
            ? 'Accuracy above 80%; increasing difficulty by one tier.'
            : 'Accuracy stable; keeping current difficulty tier.';

      const log: PracticeAdaptationLog = {
        id: randomUUID(),
        userId,
        topicId: topic.topicId,
        previousDifficultyTier: 2,
        adjustedDifficultyTier: 2 + difficultyTierDelta,
        weakAreaWeightMultiplier,
        reason,
        createdAt: new Date(),
      };
      this.adaptationLogs.unshift(log);

      return {
        topicId: topic.topicId,
        attemptedQuestions: topic.attemptedQuestions,
        accuracy: topic.accuracy,
        difficultyTierDelta,
        weakAreaWeightMultiplier: roundToTwo(weakAreaWeightMultiplier),
        reason,
      };
    });

    return {
      rollingWindowDays,
      topics: topicAdaptations,
      loggedAdaptations: this.adaptationLogs.filter((entry) => entry.userId === userId).slice(0, 20),
    };
  }

  getNonRepetitionStats(userId: string): {
    windowDays: number;
    totalAttempts: number;
    uniqueQuestionCount: number;
    repeatAttempts: number;
    repetitionRate: number;
  } {
    return this.testEngineService.getNonRepetitionStats(userId, 30);
  }

  private resolveDifficultyAdjustment(accuracy: number): -1 | 0 | 1 {
    if (accuracy < 50) {
      return -1;
    }

    if (accuracy > 80) {
      return 1;
    }

    return 0;
  }
}

const defaultFeedbackLoopService = new FeedbackLoopService();

export const createFeedbackLoopService = (options: FeedbackLoopServiceOptions = {}): FeedbackLoopService => {
  if (Object.keys(options).length === 0) {
    return defaultFeedbackLoopService;
  }

  return new FeedbackLoopService(options);
};
