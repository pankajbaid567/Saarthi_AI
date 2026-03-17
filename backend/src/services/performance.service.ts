import { AppError } from '../errors/app-error.js';

export type PerformanceQuestionAttempt = {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  topicId: string;
  topicName: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  completedAt: Date;
};

export type SubjectRetention = {
  userId: string;
  subjectId: string;
  averageRetention: number;
};

export type SubjectSyllabusCompletion = {
  userId: string;
  subjectId: string;
  completionPercentage: number;
};

export type SubjectPerformanceSnapshot = {
  subjectId: string;
  subjectName: string;
  accuracy: number;
  averageTimeSeconds: number;
  totalQuestions: number;
  correctAnswers: number;
  retentionAverage: number;
  syllabusCompletion: number;
};

export type TopicPerformanceSnapshot = {
  topicId: string;
  topicName: string;
  subjectId: string;
  subjectName: string;
  accuracy: number;
  averageTimeSeconds: number;
  totalQuestions: number;
  correctAnswers: number;
};

export type TimeManagementMetrics = {
  averageSecondsPerQuestion: number;
  medianSecondsPerQuestion: number;
  overSixtySecondsPercentage: number;
};

export type DailyPerformanceSnapshot = {
  date: string;
  totalQuestions: number;
  accuracy: number;
  subjectBreakdown: SubjectPerformanceSnapshot[];
  topicBreakdown: TopicPerformanceSnapshot[];
  timeManagement: TimeManagementMetrics;
};

export type PerformanceTrajectoryPoint = {
  date: string;
  accuracy: number;
};

export type WeakArea = {
  id: string;
  name: string;
  type: 'subject' | 'topic';
  subjectId?: string;
  subjectName?: string;
  accuracy: number;
  averageTimeSeconds: number;
  severity: number;
};

export type PerformanceOverview = {
  snapshot: DailyPerformanceSnapshot;
  trajectory: PerformanceTrajectoryPoint[];
  retentionAverage: number;
  syllabusCompletionAverage: number;
};

type PerformanceServiceOptions = {
  attempts?: PerformanceQuestionAttempt[];
  subjectRetention?: SubjectRetention[];
  subjectSyllabusCompletion?: SubjectSyllabusCompletion[];
};

const toPercentage = (value: number): number => Number((value * 100).toFixed(2));
const average = (values: number[]): number => (values.length ? Number((values.reduce((s, v) => s + v, 0) / values.length).toFixed(2)) : 0);
const dateKey = (value: Date): string => value.toISOString().slice(0, 10);

export class PerformanceService {
  private readonly attempts: PerformanceQuestionAttempt[];
  private readonly subjectRetention: SubjectRetention[];
  private readonly subjectSyllabusCompletion: SubjectSyllabusCompletion[];

  constructor(options: PerformanceServiceOptions = {}) {
    this.attempts = options.attempts ?? this.buildDefaultAttempts();
    this.subjectRetention = options.subjectRetention ?? [];
    this.subjectSyllabusCompletion = options.subjectSyllabusCompletion ?? [];
  }

  calculateDailySnapshot(userId: string, date: string): DailyPerformanceSnapshot {
    const attempts = this.getAttempts(userId).filter((attempt) => dateKey(attempt.completedAt) === date);

    const accuracy = attempts.length ? toPercentage(attempts.filter((attempt) => attempt.isCorrect).length / attempts.length) : 0;

    const subjectBreakdown = this.groupBy(attempts, (attempt) => attempt.subjectId).map((group) => {
      const first = group.items[0]!;
      return {
        subjectId: first.subjectId,
        subjectName: first.subjectName,
        accuracy: toPercentage(group.items.filter((item) => item.isCorrect).length / group.items.length),
        averageTimeSeconds: average(group.items.map((item) => item.timeSpentSeconds)),
        totalQuestions: group.items.length,
        correctAnswers: group.items.filter((item) => item.isCorrect).length,
        retentionAverage: this.getSubjectRetention(userId, first.subjectId),
        syllabusCompletion: this.getSubjectCompletion(userId, first.subjectId),
      };
    });

    const topicBreakdown = this.groupBy(attempts, (attempt) => `${attempt.subjectId}:${attempt.topicId}`).map((group) => {
      const first = group.items[0]!;
      return {
        topicId: first.topicId,
        topicName: first.topicName,
        subjectId: first.subjectId,
        subjectName: first.subjectName,
        accuracy: toPercentage(group.items.filter((item) => item.isCorrect).length / group.items.length),
        averageTimeSeconds: average(group.items.map((item) => item.timeSpentSeconds)),
        totalQuestions: group.items.length,
        correctAnswers: group.items.filter((item) => item.isCorrect).length,
      };
    });

    const times = attempts.map((attempt) => attempt.timeSpentSeconds).sort((a, b) => a - b);
    const median =
      times.length === 0
        ? 0
        : times.length % 2 === 0
          ? Number(((times[times.length / 2 - 1]! + times[times.length / 2]!) / 2).toFixed(2))
          : times[Math.floor(times.length / 2)]!;

    return {
      date,
      totalQuestions: attempts.length,
      accuracy,
      subjectBreakdown,
      topicBreakdown,
      timeManagement: {
        averageSecondsPerQuestion: average(times),
        medianSecondsPerQuestion: median,
        overSixtySecondsPercentage: attempts.length
          ? toPercentage(attempts.filter((attempt) => attempt.timeSpentSeconds > 60).length / attempts.length)
          : 0,
      },
    };
  }

  getOverview(userId: string): PerformanceOverview {
    const attempts = this.getAttempts(userId);
    const dates = [...new Set(attempts.map((attempt) => dateKey(attempt.completedAt)))].sort();
    const latestDate = dates.at(-1) ?? dateKey(new Date());

    return {
      snapshot: this.calculateDailySnapshot(userId, latestDate),
      trajectory: dates.map((date) => ({ date, accuracy: this.calculateDailySnapshot(userId, date).accuracy })),
      retentionAverage: average(this.subjectRetention.filter((item) => item.userId === userId).map((item) => item.averageRetention)),
      syllabusCompletionAverage: average(
        this.subjectSyllabusCompletion
          .filter((item) => item.userId === userId)
          .map((item) => item.completionPercentage),
      ),
    };
  }

  getSubjectPerformance(userId: string, subjectId: string): SubjectPerformanceSnapshot {
    const attempts = this.getAttempts(userId).filter((attempt) => attempt.subjectId === subjectId);
    if (attempts.length === 0) throw new AppError('Subject performance not found', 404);

    return {
      subjectId,
      subjectName: attempts[0]!.subjectName,
      accuracy: toPercentage(attempts.filter((attempt) => attempt.isCorrect).length / attempts.length),
      averageTimeSeconds: average(attempts.map((attempt) => attempt.timeSpentSeconds)),
      totalQuestions: attempts.length,
      correctAnswers: attempts.filter((attempt) => attempt.isCorrect).length,
      retentionAverage: this.getSubjectRetention(userId, subjectId),
      syllabusCompletion: this.getSubjectCompletion(userId, subjectId),
    };
  }

  getTopicPerformance(userId: string, topicId: string): TopicPerformanceSnapshot {
    const attempts = this.getAttempts(userId).filter((attempt) => attempt.topicId === topicId);
    if (attempts.length === 0) throw new AppError('Topic performance not found', 404);
    const first = attempts[0]!;

    return {
      topicId,
      topicName: first.topicName,
      subjectId: first.subjectId,
      subjectName: first.subjectName,
      accuracy: toPercentage(attempts.filter((attempt) => attempt.isCorrect).length / attempts.length),
      averageTimeSeconds: average(attempts.map((attempt) => attempt.timeSpentSeconds)),
      totalQuestions: attempts.length,
      correctAnswers: attempts.filter((attempt) => attempt.isCorrect).length,
    };
  }

  getWeakAreas(userId: string): WeakArea[] {
    const byTopic = this.groupBy(this.getAttempts(userId), (attempt) => `${attempt.subjectId}:${attempt.topicId}`);
    return byTopic
      .map((group) => {
        const first = group.items[0]!;
        const accuracy = toPercentage(group.items.filter((item) => item.isCorrect).length / group.items.length);
        return {
          id: first.topicId,
          name: first.topicName,
          type: 'topic' as const,
          subjectId: first.subjectId,
          subjectName: first.subjectName,
          accuracy,
          averageTimeSeconds: average(group.items.map((item) => item.timeSpentSeconds)),
          severity: Number((100 - accuracy).toFixed(2)),
        };
      })
      .sort((a, b) => b.severity - a.severity);
  }

  getPredictions(userId: string) {
    const overview = this.getOverview(userId);
    const weakAreas = this.getWeakAreas(userId).slice(0, 3);
    const score = Number(((overview.snapshot.accuracy / 100) * 200).toFixed(2));

    return {
      prelimsPrediction: {
        score,
        confidenceInterval: [Math.max(0, score - 8), Math.min(200, score + 8)] as [number, number],
        outOf: 200,
        category: score >= 95 ? 'Safe zone' : score >= 75 ? 'Borderline' : 'At risk',
        trend: overview.trajectory.length > 1 && overview.trajectory.at(-1)!.accuracy > overview.trajectory[0]!.accuracy ? 'improving' : 'stable',
      },
      weakAreas: weakAreas.map((item) => ({
        topic: `${item.subjectName} - ${item.name}`,
        accuracy: item.accuracy,
        severity: item.severity >= 60 ? 'high' : item.severity >= 40 ? 'medium' : 'low',
        suggestion: `Practice focused MCQs on ${item.name}`,
      })),
      estimatedRank: {
        range: score >= 95 ? '150-350' : score >= 75 ? '350-1200' : '1200+',
        confidence: overview.trajectory.length >= 5 ? 'high' : 'moderate',
        note: 'Improve weak topics to tighten prediction range.',
      },
      modelFactors: {
        retentionScore: overview.retentionAverage,
        syllabusCompletion: overview.syllabusCompletionAverage,
      },
    };
  }

  getSubject(userId: string, subjectId: string): SubjectPerformanceSnapshot {
    return this.getSubjectPerformance(userId, subjectId);
  }

  getTopic(userId: string, topicId: string): TopicPerformanceSnapshot {
    return this.getTopicPerformance(userId, topicId);
  }

  private getAttempts(userId: string): PerformanceQuestionAttempt[] {
    const attempts = this.attempts.filter((attempt) => attempt.userId === userId);
    if (attempts.length === 0) throw new AppError('Performance data not found', 404);
    return attempts;
  }

  private getSubjectRetention(userId: string, subjectId: string): number {
    return average(
      this.subjectRetention
        .filter((item) => item.userId === userId && item.subjectId === subjectId)
        .map((item) => item.averageRetention),
    );
  }

  private getSubjectCompletion(userId: string, subjectId: string): number {
    return average(
      this.subjectSyllabusCompletion
        .filter((item) => item.userId === userId && item.subjectId === subjectId)
        .map((item) => item.completionPercentage),
    );
  }

  private groupBy<T>(items: T[], keyFn: (item: T) => string): Array<{ key: string; items: T[] }> {
    const map = new Map<string, T[]>();
    items.forEach((item) => {
      const key = keyFn(item);
      map.set(key, [...(map.get(key) ?? []), item]);
    });
    return [...map.entries()].map(([key, grouped]) => ({ key, items: grouped }));
  }

  private buildDefaultAttempts(): PerformanceQuestionAttempt[] {
    return [
      {
        id: 'default-1',
        userId: 'student-user-id',
        subjectId: 'history',
        subjectName: 'History',
        topicId: 'modern',
        topicName: 'Modern India',
        isCorrect: false,
        timeSpentSeconds: 75,
        completedAt: new Date('2026-03-16T09:00:00.000Z'),
      },
      {
        id: 'default-2',
        userId: 'student-user-id',
        subjectId: 'polity',
        subjectName: 'Polity',
        topicId: 'fr',
        topicName: 'Fundamental Rights',
        isCorrect: true,
        timeSpentSeconds: 42,
        completedAt: new Date('2026-03-16T09:05:00.000Z'),
      },
    ];
  }
}

const defaultPerformanceService = new PerformanceService();

export const createPerformanceService = (options: PerformanceServiceOptions = {}): PerformanceService => {
  if (Object.keys(options).length === 0) return defaultPerformanceService;
  return new PerformanceService(options);
};
