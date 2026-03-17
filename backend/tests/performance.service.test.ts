import { describe, expect, it } from 'vitest';

import { PerformanceSchedulerService } from '../src/services/performance-scheduler.service.js';
import { PerformanceService, type PerformanceQuestionAttempt } from '../src/services/performance.service.js';

const attempts: PerformanceQuestionAttempt[] = [
  {
    id: 'a-1',
    userId: 'student-user-id',
    subjectId: 'polity',
    subjectName: 'Polity',
    topicId: 'fr',
    topicName: 'Fundamental Rights',
    isCorrect: true,
    timeSpentSeconds: 42,
    completedAt: new Date('2026-03-15T09:00:00.000Z'),
  },
  {
    id: 'a-2',
    userId: 'student-user-id',
    subjectId: 'polity',
    subjectName: 'Polity',
    topicId: 'fr',
    topicName: 'Fundamental Rights',
    isCorrect: false,
    timeSpentSeconds: 71,
    completedAt: new Date('2026-03-15T09:03:00.000Z'),
  },
  {
    id: 'a-3',
    userId: 'student-user-id',
    subjectId: 'history',
    subjectName: 'History',
    topicId: 'medieval',
    topicName: 'Medieval India',
    isCorrect: false,
    timeSpentSeconds: 58,
    completedAt: new Date('2026-03-15T09:08:00.000Z'),
  },
  {
    id: 'a-4',
    userId: 'student-user-id',
    subjectId: 'history',
    subjectName: 'History',
    topicId: 'medieval',
    topicName: 'Medieval India',
    isCorrect: true,
    timeSpentSeconds: 35,
    completedAt: new Date('2026-03-16T09:08:00.000Z'),
  },
  {
    id: 'a-5',
    userId: 'student-user-id',
    subjectId: 'history',
    subjectName: 'History',
    topicId: 'medieval',
    topicName: 'Medieval India',
    isCorrect: false,
    timeSpentSeconds: 88,
    completedAt: new Date('2026-03-16T09:15:00.000Z'),
  },
];

describe('performance service', () => {
  it('builds daily snapshots, deep dives, weak areas, and trend trajectory with retention and syllabus data', () => {
    const performanceService = new PerformanceService({
      attempts,
      subjectRetention: [
        { userId: 'student-user-id', subjectId: 'polity', averageRetention: 76 },
        { userId: 'student-user-id', subjectId: 'history', averageRetention: 54 },
      ],
      subjectSyllabusCompletion: [
        { userId: 'student-user-id', subjectId: 'polity', completionPercentage: 68 },
        { userId: 'student-user-id', subjectId: 'history', completionPercentage: 45 },
      ],
    });

    const dailySnapshot = performanceService.calculateDailySnapshot('student-user-id', '2026-03-15');
    expect(dailySnapshot.totalQuestions).toBe(3);
    expect(dailySnapshot.subjectBreakdown).toHaveLength(2);
    expect(dailySnapshot.topicBreakdown).toHaveLength(2);
    expect(dailySnapshot.timeManagement.averageSecondsPerQuestion).toBeGreaterThan(0);
    expect(dailySnapshot.timeManagement.overSixtySecondsPercentage).toBeGreaterThan(0);

    const overview = performanceService.getOverview('student-user-id');
    expect(overview.snapshot.date).toBe('2026-03-16');
    expect(overview.trajectory).toHaveLength(2);
    expect(overview.retentionAverage).toBeGreaterThan(0);
    expect(overview.syllabusCompletionAverage).toBeGreaterThan(0);

    expect(performanceService.getSubjectPerformance('student-user-id', 'history')).toEqual(
      expect.objectContaining({ subjectId: 'history' }),
    );
    expect(performanceService.getTopicPerformance('student-user-id', 'medieval')).toEqual(
      expect.objectContaining({ topicId: 'medieval' }),
    );

    const weakAreas = performanceService.getWeakAreas('student-user-id');
    expect(weakAreas.length).toBeGreaterThan(0);
    expect(weakAreas[0]).toEqual(expect.objectContaining({ severity: expect.any(Number) }));
  });

  it('provides scheduled jobs and snapshot/report generation helpers', () => {
    const performanceService = new PerformanceService({ attempts });
    const scheduler = new PerformanceSchedulerService({ performanceService });

    expect(scheduler.getScheduledJobs().map((job) => job.name)).toEqual([
      'daily-snapshot',
      'weekly-report',
      'monthly-trend',
    ]);
    expect(scheduler.runDailyPerformanceSnapshot('student-user-id', '2026-03-15').totalQuestions).toBe(3);
    expect(scheduler.runWeeklyPerformanceReport('student-user-id', new Date('2026-03-16T00:00:00.000Z'))).toHaveLength(7);
    expect(scheduler.runMonthlyTrendAnalysis('student-user-id', new Date('2026-03-16T00:00:00.000Z'))).toHaveLength(30);
  });
});
