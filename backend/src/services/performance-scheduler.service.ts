import type { DailyPerformanceSnapshot, PerformanceService } from './performance.service.js';

export type ScheduledPerformanceJob = {
  name: 'daily-snapshot' | 'weekly-report' | 'monthly-trend';
  cron: string;
  description: string;
};

type PerformanceSchedulerServiceOptions = {
  performanceService: PerformanceService;
};

const normalizeDate = (date: Date): string => date.toISOString().slice(0, 10);

const withDayOffset = (date: Date, offset: number): Date => {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + offset);
  return copy;
};

export class PerformanceSchedulerService {
  private readonly schedules: ScheduledPerformanceJob[] = [
    {
      name: 'daily-snapshot',
      cron: '0 1 * * *',
      description: 'Daily performance snapshot generation',
    },
    {
      name: 'weekly-report',
      cron: '0 2 * * 1',
      description: 'Weekly performance report generation',
    },
    {
      name: 'monthly-trend',
      cron: '0 3 1 * *',
      description: 'Monthly trend analysis generation',
    },
  ];

  constructor(private readonly options: PerformanceSchedulerServiceOptions) {}

  getScheduledJobs(): ScheduledPerformanceJob[] {
    return this.schedules;
  }

  runDailyPerformanceSnapshot(userId: string, date = normalizeDate(new Date())): DailyPerformanceSnapshot {
    return this.options.performanceService.calculateDailySnapshot(userId, date);
  }

  runWeeklyPerformanceReport(userId: string, referenceDate = new Date()): DailyPerformanceSnapshot[] {
    const snapshots: DailyPerformanceSnapshot[] = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      snapshots.push(this.runDailyPerformanceSnapshot(userId, normalizeDate(withDayOffset(referenceDate, -offset))));
    }
    return snapshots;
  }

  runMonthlyTrendAnalysis(userId: string, referenceDate = new Date()): DailyPerformanceSnapshot[] {
    const snapshots: DailyPerformanceSnapshot[] = [];
    for (let offset = 29; offset >= 0; offset -= 1) {
      snapshots.push(this.runDailyPerformanceSnapshot(userId, normalizeDate(withDayOffset(referenceDate, -offset))));
    }
    return snapshots;
  }
}

