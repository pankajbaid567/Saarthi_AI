import { AppError } from '../errors/app-error.js';

type PerformanceAttempt = {
  userId: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  accuracy: number;
  score: number;
  attemptedAt: Date;
  retentionScore: number;
  syllabusCompletion: number;
  confusionWithTopicId?: string;
};

type WeakArea = {
  topicId: string;
  topic: string;
  accuracy: number;
  severity: 'high' | 'medium' | 'low';
  suggestion: string;
  confusionPattern: string | null;
};

type PredictionResult = {
  prelimsPrediction: {
    score: number;
    confidenceInterval: [number, number];
    outOf: number;
    category: 'Safe zone' | 'Borderline' | 'At risk';
    trend: 'improving' | 'stable' | 'declining';
  };
  weakAreas: Array<Pick<WeakArea, 'topic' | 'accuracy' | 'severity' | 'suggestion'>>;
  estimatedRank: {
    range: string;
    confidence: 'high' | 'moderate' | 'low';
    note: string;
  };
  modelFactors: {
    retentionScore: number;
    syllabusCompletion: number;
  };
};

type PerformanceServiceOptions = {
  attempts?: PerformanceAttempt[];
};

const round = (value: number): number => Number(value.toFixed(2));

const average = (values: number[]): number => {
  if (values.length === 0) {
    return 0;
  }

  return round(values.reduce((sum, value) => sum + value, 0) / values.length);
};

export class PerformanceService {
  private readonly attempts: PerformanceAttempt[];

  constructor(options: PerformanceServiceOptions = {}) {
    this.attempts = options.attempts ?? this.buildDefaultAttempts();
  }

  getOverview(userId: string) {
    const userAttempts = this.getAttempts(userId);
    const overallAccuracy = average(userAttempts.map((attempt) => attempt.accuracy));
    const avgScore = average(userAttempts.map((attempt) => attempt.score));
    const studyHours = round(userAttempts.length * 0.75);

    const groupedBySubject = new Map<string, { subjectId: string; name: string; accuracy: number[]; testsAttempted: number }>();
    userAttempts.forEach((attempt) => {
      const current = groupedBySubject.get(attempt.subjectId) ?? {
        subjectId: attempt.subjectId,
        name: attempt.subjectName,
        accuracy: [],
        testsAttempted: 0,
      };
      current.accuracy.push(attempt.accuracy);
      current.testsAttempted += 1;
      groupedBySubject.set(attempt.subjectId, current);
    });

    return {
      overall: {
        testsAttempted: userAttempts.length,
        totalQuestions: userAttempts.length * 25,
        accuracy: overallAccuracy,
        avgScore,
      },
      subjectWise: [...groupedBySubject.values()].map((item) => ({
        subjectId: item.subjectId,
        name: item.name,
        accuracy: average(item.accuracy),
        testsAttempted: item.testsAttempted,
      })),
      studyStreak: Math.min(30, userAttempts.length),
      totalStudyHours: studyHours,
    };
  }

  getSubject(userId: string, subjectId: string) {
    const userAttempts = this.getAttempts(userId).filter((attempt) => attempt.subjectId === subjectId);
    if (userAttempts.length === 0) {
      throw new AppError('Subject performance not found', 404);
    }

    return {
      subjectId,
      subjectName: userAttempts[0]!.subjectName,
      accuracy: average(userAttempts.map((attempt) => attempt.accuracy)),
      retentionScore: average(userAttempts.map((attempt) => attempt.retentionScore)),
      syllabusCompletion: average(userAttempts.map((attempt) => attempt.syllabusCompletion)),
      attempts: userAttempts.length,
    };
  }

  getTopic(userId: string, topicId: string) {
    const userAttempts = this.getAttempts(userId).filter((attempt) => attempt.topicId === topicId);
    if (userAttempts.length === 0) {
      throw new AppError('Topic performance not found', 404);
    }

    const latest = userAttempts.sort((first, second) => second.attemptedAt.getTime() - first.attemptedAt.getTime())[0]!;
    return {
      topicId,
      topicName: latest.topicName,
      subjectId: latest.subjectId,
      accuracy: average(userAttempts.map((attempt) => attempt.accuracy)),
      retentionScore: average(userAttempts.map((attempt) => attempt.retentionScore)),
      confusionWithTopicId: latest.confusionWithTopicId ?? null,
      recommendation: `Revise ${latest.topicName} with focused active recall sessions.`,
    };
  }

  getPredictions(userId: string): PredictionResult {
    const userAttempts = this.getAttempts(userId);
    const accuracies = userAttempts.map((attempt) => attempt.accuracy);
    const baseAccuracy = average(accuracies);
    const retentionScore = average(userAttempts.map((attempt) => attempt.retentionScore));
    const syllabusCompletion = average(userAttempts.map((attempt) => attempt.syllabusCompletion));

    const sorted = [...userAttempts].sort((first, second) => first.attemptedAt.getTime() - second.attemptedAt.getTime());
    const midpoint = Math.max(1, Math.floor(sorted.length / 2));
    const earlyAccuracy = average(sorted.slice(0, midpoint).map((attempt) => attempt.accuracy));
    const lateAccuracy = average(sorted.slice(midpoint).map((attempt) => attempt.accuracy));
    const delta = round(lateAccuracy - earlyAccuracy);

    const trend: PredictionResult['prelimsPrediction']['trend'] = delta > 2 ? 'improving' : delta < -2 ? 'declining' : 'stable';
    const weightedAccuracy = round(baseAccuracy * 0.7 + retentionScore * 0.15 + syllabusCompletion * 0.15);
    const predictedScore = Math.min(200, Math.max(0, round((weightedAccuracy / 100) * 200)));
    const spread = Math.max(4, Math.round(Math.max(0, 100 - userAttempts.length * 5) / 10));
    const confidenceInterval: [number, number] = [
      Math.max(0, predictedScore - spread),
      Math.min(200, predictedScore + spread),
    ];

    const weakAreas = this.getWeakAreas(userId).slice(0, 3).map((item) => ({
      topic: item.topic,
      accuracy: item.accuracy,
      severity: item.severity,
      suggestion: item.suggestion,
    }));

    const category: PredictionResult['prelimsPrediction']['category'] =
      predictedScore >= 95 ? 'Safe zone' : predictedScore >= 75 ? 'Borderline' : 'At risk';

    const rankRange = predictedScore >= 95 ? '150-350' : predictedScore >= 75 ? '350-1200' : '1200+';
    const confidence: PredictionResult['estimatedRank']['confidence'] =
      userAttempts.length >= 8 ? 'high' : userAttempts.length >= 5 ? 'moderate' : 'low';

    return {
      prelimsPrediction: {
        score: predictedScore,
        confidenceInterval,
        outOf: 200,
        category,
        trend,
      },
      weakAreas,
      estimatedRank: {
        range: rankRange,
        confidence,
        note: weakAreas.length > 0 ? `Improve ${weakAreas[0]!.topic} to tighten your rank range.` : 'Maintain momentum.',
      },
      modelFactors: {
        retentionScore,
        syllabusCompletion,
      },
    };
  }

  getWeakAreas(userId: string): WeakArea[] {
    return this.getAttempts(userId)
      .filter((attempt) => attempt.accuracy < 60)
      .map((attempt) => {
        const severity: WeakArea['severity'] =
          attempt.accuracy < 40 ? 'high' : attempt.accuracy < 50 ? 'medium' : 'low';

        return {
          topicId: attempt.topicId,
          topic: `${attempt.subjectName} - ${attempt.topicName}`,
          accuracy: attempt.accuracy,
          severity,
          suggestion: `Practice 20 targeted questions on ${attempt.topicName} and revise error notes.`,
          confusionPattern: attempt.confusionWithTopicId
            ? `${attempt.topicName} is frequently confused with ${attempt.confusionWithTopicId}`
            : null,
        };
      })
      .sort((first, second) => first.accuracy - second.accuracy);
  }

  private getAttempts(userId: string): PerformanceAttempt[] {
    const userAttempts = this.attempts.filter((attempt) => attempt.userId === userId);
    if (userAttempts.length === 0) {
      throw new AppError('Performance data not found', 404);
    }

    return userAttempts;
  }

  private buildDefaultAttempts(): PerformanceAttempt[] {
    return [
      {
        userId: 'student-user-id',
        subjectId: '11111111-1111-4111-8111-111111111111',
        subjectName: 'Indian Polity',
        topicId: '21111111-1111-4111-8111-111111111111',
        topicName: 'Fundamental Rights',
        accuracy: 68,
        score: 66,
        attemptedAt: new Date('2026-03-10T10:00:00.000Z'),
        retentionScore: 62,
        syllabusCompletion: 54,
        confusionWithTopicId: 'Directive Principles',
      },
      {
        userId: 'student-user-id',
        subjectId: '11111111-1111-4111-8111-111111111111',
        subjectName: 'Indian Polity',
        topicId: '31111111-1111-4111-8111-111111111111',
        topicName: 'Parliament',
        accuracy: 74,
        score: 72,
        attemptedAt: new Date('2026-03-12T10:00:00.000Z'),
        retentionScore: 69,
        syllabusCompletion: 54,
      },
      {
        userId: 'student-user-id',
        subjectId: '41111111-1111-4111-8111-111111111111',
        subjectName: 'Indian Economy',
        topicId: '51111111-1111-4111-8111-111111111111',
        topicName: 'External Sector',
        accuracy: 46,
        score: 44,
        attemptedAt: new Date('2026-03-14T10:00:00.000Z'),
        retentionScore: 52,
        syllabusCompletion: 48,
      },
      {
        userId: 'student-user-id',
        subjectId: '41111111-1111-4111-8111-111111111111',
        subjectName: 'Indian Economy',
        topicId: '61111111-1111-4111-8111-111111111111',
        topicName: 'Inflation',
        accuracy: 58,
        score: 56,
        attemptedAt: new Date('2026-03-16T10:00:00.000Z'),
        retentionScore: 57,
        syllabusCompletion: 48,
      },
    ];
  }
}

export const createPerformanceService = (options: PerformanceServiceOptions = {}) => new PerformanceService(options);
