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

  return Number((sorted[middle] ?? 0).toFixed(2));
};

const normalizeDate = (date: Date): string => date.toISOString().slice(0, 10);
const weakAreaTimeWeight = 0.5;
const calculateWeakAreaSeverity = (accuracy: number, averageTimeSeconds: number): number =>
  Number((100 - accuracy + averageTimeSeconds * weakAreaTimeWeight).toFixed(2));

export class PerformanceService {
  private readonly attempts: PerformanceQuestionAttempt[];

  private readonly retentionBySubject = new Map<string, number>();

  private readonly syllabusBySubject = new Map<string, number>();

  constructor(options: PerformanceServiceOptions = {}) {
    this.attempts = options.attempts ?? [];

    (options.subjectRetention ?? []).forEach((entry) => {
      this.retentionBySubject.set(`${entry.userId}::${entry.subjectId}`, entry.averageRetention);
    });

    (options.subjectSyllabusCompletion ?? []).forEach((entry) => {
      this.syllabusBySubject.set(`${entry.userId}::${entry.subjectId}`, entry.completionPercentage);
    });
  }

  private getUserAttempts(userId: string): PerformanceQuestionAttempt[] {
    return this.attempts.filter((attempt) => attempt.userId === userId);
  }

  private getAttemptsForDate(userId: string, date: string): PerformanceQuestionAttempt[] {
    return this.getUserAttempts(userId).filter((attempt) => normalizeDate(attempt.completedAt) === date);
  }

  private buildSubjectBreakdown(userId: string, attempts: PerformanceQuestionAttempt[]): SubjectPerformanceSnapshot[] {
    const grouped = new Map<
      string,
      { subjectId: string; subjectName: string; totalQuestions: number; correctAnswers: number; times: number[] }
    >();

    attempts.forEach((attempt) => {
      const current = grouped.get(attempt.subjectId) ?? {
        subjectId: attempt.subjectId,
        subjectName: attempt.subjectName,
        totalQuestions: 0,
        correctAnswers: 0,
        times: [],
      };
      current.totalQuestions += 1;
      if (attempt.isCorrect) {
        current.correctAnswers += 1;
      }
      current.times.push(attempt.timeSpentSeconds);
      grouped.set(attempt.subjectId, current);
    });

    return [...grouped.values()]
      .map((subject) => ({
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        accuracy: subject.totalQuestions === 0 ? 0 : toPercentage(subject.correctAnswers / subject.totalQuestions),
        averageTimeSeconds: average(subject.times),
        totalQuestions: subject.totalQuestions,
        correctAnswers: subject.correctAnswers,
        retentionAverage: this.retentionBySubject.get(`${userId}::${subject.subjectId}`) ?? 0,
        syllabusCompletion: this.syllabusBySubject.get(`${userId}::${subject.subjectId}`) ?? 0,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);
  }

  private buildTopicBreakdown(attempts: PerformanceQuestionAttempt[]): TopicPerformanceSnapshot[] {
    const grouped = new Map<
      string,
      {
        topicId: string;
        topicName: string;
        subjectId: string;
        subjectName: string;
        totalQuestions: number;
        correctAnswers: number;
        times: number[];
      }
    >();

    attempts.forEach((attempt) => {
      const current = grouped.get(attempt.topicId) ?? {
        topicId: attempt.topicId,
        topicName: attempt.topicName,
        subjectId: attempt.subjectId,
        subjectName: attempt.subjectName,
        totalQuestions: 0,
        correctAnswers: 0,
        times: [],
      };
      current.totalQuestions += 1;
      if (attempt.isCorrect) {
        current.correctAnswers += 1;
      }
      current.times.push(attempt.timeSpentSeconds);
      grouped.set(attempt.topicId, current);
    });

    return [...grouped.values()]
      .map((topic) => ({
        topicId: topic.topicId,
        topicName: topic.topicName,
        subjectId: topic.subjectId,
        subjectName: topic.subjectName,
        accuracy: topic.totalQuestions === 0 ? 0 : toPercentage(topic.correctAnswers / topic.totalQuestions),
        averageTimeSeconds: average(topic.times),
        totalQuestions: topic.totalQuestions,
        correctAnswers: topic.correctAnswers,
      }))
      .sort((a, b) => a.accuracy - b.accuracy);
  }

  private buildTimeManagement(attempts: PerformanceQuestionAttempt[]): TimeManagementMetrics {
    const times = attempts.map((attempt) => attempt.timeSpentSeconds);
    const overSixty = attempts.filter((attempt) => attempt.timeSpentSeconds > 60).length;
    return {
      averageSecondsPerQuestion: average(times),
      medianSecondsPerQuestion: median(times),
      overSixtySecondsPercentage: attempts.length === 0 ? 0 : toPercentage(overSixty / attempts.length),
    };
  }

  calculateDailySnapshot(userId: string, date = normalizeDate(new Date())): DailyPerformanceSnapshot {
    const attempts = this.getAttemptsForDate(userId, date);
    const totalQuestions = attempts.length;
    const correctAnswers = attempts.filter((attempt) => attempt.isCorrect).length;
    const accuracy = totalQuestions === 0 ? 0 : toPercentage(correctAnswers / totalQuestions);

    return {
      date,
      totalQuestions,
      accuracy,
      subjectBreakdown: this.buildSubjectBreakdown(userId, attempts),
      topicBreakdown: this.buildTopicBreakdown(attempts),
      timeManagement: this.buildTimeManagement(attempts),
    };
  }

  getImprovementTrajectory(userId: string): PerformanceTrajectoryPoint[] {
    const userAttempts = this.getUserAttempts(userId);
    const dates = [...new Set(userAttempts.map((attempt) => normalizeDate(attempt.completedAt)))].sort();
    return dates.map((date) => {
      const snapshot = this.calculateDailySnapshot(userId, date);
      return { date, accuracy: snapshot.accuracy };
    });
  }

  getOverview(userId: string): PerformanceOverview {
    const trajectory = this.getImprovementTrajectory(userId);
    const latestDate = trajectory.at(-1)?.date ?? normalizeDate(new Date());
    const snapshot = this.calculateDailySnapshot(userId, latestDate);

    return {
      snapshot,
      trajectory,
      retentionAverage: average(snapshot.subjectBreakdown.map((subject) => subject.retentionAverage)),
      syllabusCompletionAverage: average(snapshot.subjectBreakdown.map((subject) => subject.syllabusCompletion)),
    };
  }

  getSubjectPerformance(userId: string, subjectId: string): SubjectPerformanceSnapshot {
    const snapshot = this.getOverview(userId).snapshot.subjectBreakdown.find((subject) => subject.subjectId === subjectId);
    if (!snapshot) {
      throw new AppError('Subject performance not found', 404);
    }

    return snapshot;
  }

  getTopicPerformance(userId: string, topicId: string): TopicPerformanceSnapshot {
    const snapshot = this.getOverview(userId).snapshot.topicBreakdown.find((topic) => topic.topicId === topicId);
    if (!snapshot) {
      throw new AppError('Topic performance not found', 404);
    }

    return snapshot;
  }

  getWeakAreas(userId: string): WeakArea[] {
    const overview = this.getOverview(userId);
    const weakSubjects: WeakArea[] = overview.snapshot.subjectBreakdown.map((subject) => ({
      id: subject.subjectId,
      name: subject.subjectName,
      type: 'subject',
      accuracy: subject.accuracy,
      averageTimeSeconds: subject.averageTimeSeconds,
      severity: calculateWeakAreaSeverity(subject.accuracy, subject.averageTimeSeconds),
    }));

    const weakTopics: WeakArea[] = overview.snapshot.topicBreakdown.map((topic) => ({
      id: topic.topicId,
      name: topic.topicName,
      type: 'topic',
      subjectId: topic.subjectId,
      subjectName: topic.subjectName,
      accuracy: topic.accuracy,
      averageTimeSeconds: topic.averageTimeSeconds,
      severity: calculateWeakAreaSeverity(topic.accuracy, topic.averageTimeSeconds),
    }));

    return [...weakSubjects, ...weakTopics]
      .filter((area) => area.accuracy < 70)
      .sort((a, b) => b.severity - a.severity);
  }
}

const defaultPerformanceService = new PerformanceService();

export const createPerformanceService = (options: PerformanceServiceOptions = {}): PerformanceService => {
  if (Object.keys(options).length === 0) {
    return defaultPerformanceService;
  }

  return new PerformanceService(options);
};
