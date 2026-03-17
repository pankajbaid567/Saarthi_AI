import { randomUUID } from 'crypto';
import { AppError } from '../errors/app-error.js';

type StrategyTaskType = 'study' | 'practice' | 'revision' | 'mains' | 'essay';

type StrategyTask = {
  id: string;
  type: StrategyTaskType;
  title: string;
  estimatedMinutes: number;
  source: 'SyllabusFlow' | 'NeuroRevise' | 'StrategyEngine';
  completed: boolean;
};

type StrategySignalsInput = {
  syllabusCoveragePercent?: number;
  weakAreas?: string[];
  retentionUrgencyCount?: number;
  timeAvailableMinutes?: number;
  targetDate?: string;
  prelimsFocusPercent?: number;
};

type DailyPlan = {
  id: string;
  date: string;
  generatedAt: Date;
  tasks: StrategyTask[];
  summary: {
    completionPercent: number;
    weakAreaFocus: string[];
    overloadAdjusted: boolean;
    burnoutRisk: boolean;
    targetDate: string | null;
  };
};

type WeeklyPlan = {
  weekStart: string;
  plans: DailyPlan[];
  targets: {
    weeklyStudyMinutes: number;
    weeklyPracticeQuestions: number;
    mainsAnswers: number;
    essayCount: number;
  };
};

type UserStrategyState = {
  today: DailyPlan;
  week: WeeklyPlan;
  completionHistory: number[];
  signals: Required<Omit<StrategySignalsInput, 'targetDate'>> & { targetDate: string | null };
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const toDateKey = (value: Date): string => value.toISOString().slice(0, 10);

const startOfWeek = (value: Date): Date => {
  const result = new Date(value);
  const day = result.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setUTCDate(result.getUTCDate() + diff);
  return result;
};

const defaultSignals = (): UserStrategyState['signals'] => ({
  syllabusCoveragePercent: 35,
  weakAreas: ['Polity - FR vs DPSP', 'Geography - Climatology'],
  retentionUrgencyCount: 3,
  timeAvailableMinutes: 240,
  prelimsFocusPercent: 0.6,
  targetDate: null,
});

const average = (values: number[]): number => {
  if (values.length === 0) {
    return 70;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export class StrategyService {
  private readonly state = new Map<string, UserStrategyState>();

  getTodayPlan(userId: string): DailyPlan {
    const userState = this.ensureState(userId);
    const today = toDateKey(new Date());

    if (userState.today.date !== today) {
      const refreshed = this.generatePlans(userState.signals, userState.completionHistory);
      userState.today = refreshed.today;
      userState.week = refreshed.week;
    }

    return userState.today;
  }

  getWeekPlan(userId: string): WeeklyPlan {
    const userState = this.ensureState(userId);
    this.getTodayPlan(userId);
    return userState.week;
  }

  generate(userId: string, input: StrategySignalsInput = {}): { today: DailyPlan; week: WeeklyPlan } {
    const userState = this.ensureState(userId);
    userState.signals = {
      ...userState.signals,
      ...input,
      weakAreas: input.weakAreas ?? userState.signals.weakAreas,
      targetDate: input.targetDate ?? userState.signals.targetDate,
      timeAvailableMinutes: clamp(input.timeAvailableMinutes ?? userState.signals.timeAvailableMinutes, 60, 720),
      prelimsFocusPercent: clamp(input.prelimsFocusPercent ?? userState.signals.prelimsFocusPercent, 0.2, 0.9),
      retentionUrgencyCount: clamp(input.retentionUrgencyCount ?? userState.signals.retentionUrgencyCount, 0, 20),
      syllabusCoveragePercent: clamp(input.syllabusCoveragePercent ?? userState.signals.syllabusCoveragePercent, 0, 100),
    };

    const generated = this.generatePlans(userState.signals, userState.completionHistory);
    userState.today = generated.today;
    userState.week = generated.week;
    return generated;
  }

  completeTask(userId: string, taskId: string, completed = true): DailyPlan {
    const userState = this.ensureState(userId);
    let matched = false;

    for (const plan of userState.week.plans) {
      for (const task of plan.tasks) {
        if (task.id === taskId) {
          task.completed = completed;
          matched = true;
        }
      }
      plan.summary.completionPercent = this.calculateCompletionPercent(plan.tasks);
    }

    if (!matched) {
      throw new AppError('Strategy task not found', 404);
    }

    userState.today = userState.week.plans.find((plan) => plan.date === toDateKey(new Date())) ?? userState.week.plans[0];
    userState.completionHistory = [...userState.completionHistory, userState.today.summary.completionPercent].slice(-7);
    return userState.today;
  }

  private ensureState(userId: string): UserStrategyState {
    const existing = this.state.get(userId);
    if (existing) {
      return existing;
    }

    const signals = defaultSignals();
    const generated = this.generatePlans(signals, []);
    const state: UserStrategyState = {
      today: generated.today,
      week: generated.week,
      completionHistory: [],
      signals,
    };

    this.state.set(userId, state);
    return state;
  }

  private calculateCompletionPercent(tasks: StrategyTask[]): number {
    if (tasks.length === 0) {
      return 0;
    }

    const completedCount = tasks.filter((task) => task.completed).length;
    return Number(((completedCount / tasks.length) * 100).toFixed(2));
  }

  private generatePlans(
    signals: UserStrategyState['signals'],
    completionHistory: number[],
  ): { today: DailyPlan; week: WeeklyPlan } {
    const now = new Date();
    const historyAverage = average(completionHistory);
    const burnoutRisk = completionHistory.length >= 3 && completionHistory.slice(-3).every((value) => value < 45);
    const overload = signals.timeAvailableMinutes < 180 || signals.weakAreas.length >= 4 || historyAverage < 55;
    const totalBudget = Math.floor(signals.timeAvailableMinutes * (overload || burnoutRisk ? 0.85 : 1));

    const weekStartDate = startOfWeek(now);
    const plans: DailyPlan[] = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const dayDate = new Date(weekStartDate);
      dayDate.setUTCDate(weekStartDate.getUTCDate() + offset);
      const isEssayDay = offset === 6;
      plans.push(this.buildDailyPlan(dayDate, signals, totalBudget, overload, burnoutRisk, isEssayDay));
    }

    const today = plans.find((plan) => plan.date === toDateKey(now)) ?? plans[0];
    const weeklyStudyMinutes = plans
      .flatMap((plan) => plan.tasks)
      .filter((task) => task.type === 'study' || task.type === 'revision')
      .reduce((sum, task) => sum + task.estimatedMinutes, 0);
    const weeklyPracticeQuestions = plans
      .flatMap((plan) => plan.tasks)
      .filter((task) => task.type === 'practice')
      .length * 25;

    return {
      today,
      week: {
        weekStart: toDateKey(weekStartDate),
        plans,
        targets: {
          weeklyStudyMinutes,
          weeklyPracticeQuestions,
          mainsAnswers: plans.flatMap((plan) => plan.tasks).filter((task) => task.type === 'mains').length,
          essayCount: plans.flatMap((plan) => plan.tasks).filter((task) => task.type === 'essay').length,
        },
      },
    };
  }

  private buildDailyPlan(
    date: Date,
    signals: UserStrategyState['signals'],
    totalBudget: number,
    overloadAdjusted: boolean,
    burnoutRisk: boolean,
    includeEssay: boolean,
  ): DailyPlan {
    const weakAreaFocus = signals.weakAreas.slice(0, 2);
    const revisionMinutes = clamp(25 + signals.retentionUrgencyCount * 5, 25, 90);
    const practiceMinutes = clamp(35 + weakAreaFocus.length * 10, 30, 90);
    const mainsMinutes = clamp(Math.round(totalBudget * (1 - signals.prelimsFocusPercent) * 0.45), 20, 75);
    const essayMinutes = includeEssay ? 45 : 0;
    const used = revisionMinutes + practiceMinutes + mainsMinutes + essayMinutes;
    const studyMinutes = clamp(totalBudget - used, 35, 180);

    const tasks: StrategyTask[] = [
      {
        id: randomUUID(),
        type: 'study',
        title: `Study focus: ${weakAreaFocus[0] ?? 'High-weight static topic'}`,
        estimatedMinutes: studyMinutes,
        source: 'SyllabusFlow',
        completed: false,
      },
      {
        id: randomUUID(),
        type: 'practice',
        title: `Practice 25 MCQs on ${weakAreaFocus[0] ?? 'current focus area'}`,
        estimatedMinutes: practiceMinutes,
        source: 'SyllabusFlow',
        completed: false,
      },
      {
        id: randomUUID(),
        type: 'revision',
        title: `NeuroRevise retention sprint (${signals.retentionUrgencyCount} urgent cards)` ,
        estimatedMinutes: revisionMinutes,
        source: 'NeuroRevise',
        completed: false,
      },
      {
        id: randomUUID(),
        type: 'mains',
        title: 'Write one mains answer and self-evaluate',
        estimatedMinutes: mainsMinutes,
        source: 'StrategyEngine',
        completed: false,
      },
    ];

    if (includeEssay) {
      tasks.push({
        id: randomUUID(),
        type: 'essay',
        title: 'Weekly essay drill (1 outline + 1 intro)',
        estimatedMinutes: essayMinutes,
        source: 'StrategyEngine',
        completed: false,
      });
    }

    return {
      id: randomUUID(),
      date: toDateKey(date),
      generatedAt: new Date(),
      tasks,
      summary: {
        completionPercent: 0,
        weakAreaFocus,
        overloadAdjusted,
        burnoutRisk,
        targetDate: signals.targetDate,
      },
    };
  }
}

export const createStrategyService = (): StrategyService => new StrategyService();

export type { DailyPlan, StrategySignalsInput, StrategyTask, WeeklyPlan };
