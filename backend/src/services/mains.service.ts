import { randomUUID } from 'crypto';

import { AppError } from '../errors/app-error.js';
import { createTestEngineService, type TestEngineService } from './test-engine.service.js';

type MainsDailyQuestion = {
  id: string;
  prompt: string;
  focusAreas: string[];
};

type GateOverride = {
  id: string;
  userId: string;
  reason: string;
  overriddenBy: string;
  createdAt: Date;
};

type MainsSubmission = {
  id: string;
  userId: string;
  questionId: string;
  answer: string;
  submittedAt: Date;
};

type MainsServiceOptions = {
  requiredDailyMcqAttempts?: number;
  testEngineService?: TestEngineService;
};

const dailyQuestionBank: MainsDailyQuestion[] = [
  {
    id: 'mains-q-governance-accountability',
    prompt:
      'Good governance in India depends more on institutional accountability than administrative efficiency. Discuss with examples.',
    focusAreas: ['governance', 'public administration', 'ethics'],
  },
  {
    id: 'mains-q-polity-federalism',
    prompt:
      'Cooperative federalism has improved policy execution in India, but competitive federalism has improved outcomes. Critically evaluate.',
    focusAreas: ['polity', 'federalism', 'public policy'],
  },
  {
    id: 'mains-q-economy-inclusion',
    prompt:
      'Inclusive growth requires both fiscal support and structural reforms. Examine this statement in the Indian context.',
    focusAreas: ['economy', 'inclusive growth', 'reforms'],
  },
];

const toDateKey = (value: Date): string => value.toISOString().slice(0, 10);
const millisecondsPerDay = 86400000;

export class MainsService {
  private readonly requiredDailyMcqAttempts: number;
  private readonly testEngineService: TestEngineService;
  private readonly gateOverrides = new Map<string, GateOverride>();
  private readonly submissionsByUser = new Map<string, MainsSubmission[]>();

  constructor(options: MainsServiceOptions = {}) {
    this.requiredDailyMcqAttempts = options.requiredDailyMcqAttempts ?? 5;
    this.testEngineService = options.testEngineService ?? createTestEngineService();
  }

  async getGateStatus(userId: string) {
    const dateKey = toDateKey(new Date());
    const override = this.gateOverrides.get(`${userId}:${dateKey}`);
    const attemptedMcqs = await this.testEngineService.getDailyAttemptedMcqCount(userId);
    const isUnlocked = Boolean(override) || attemptedMcqs >= this.requiredDailyMcqAttempts;

    return {
      date: dateKey,
      requiredMcqs: this.requiredDailyMcqAttempts,
      attemptedMcqs,
      isUnlocked,
      overrideApplied: Boolean(override),
    };
  }

  async getDailyQuestion(userId: string): Promise<{
    gateStatus: Awaited<ReturnType<MainsService['getGateStatus']>>;
    question: MainsDailyQuestion | null;
  }> {
    const gateStatus = await this.getGateStatus(userId);
    if (!gateStatus.isUnlocked) {
      return { gateStatus, question: null };
    }

    return { gateStatus, question: this.resolveQuestionForToday() };
  }

  overrideGate(userId: string, overriddenBy: string, reason: string): GateOverride {
    const override: GateOverride = {
      id: randomUUID(),
      userId,
      reason,
      overriddenBy,
      createdAt: new Date(),
    };

    this.gateOverrides.set(`${userId}:${toDateKey(override.createdAt)}`, override);
    return override;
  }

  async submitDailyAnswer(userId: string, answer: string): Promise<MainsSubmission> {
    if (!(await this.getGateStatus(userId)).isUnlocked) {
      throw new AppError('Mains question is locked until daily MCQ gate is cleared', 403);
    }

    const submission: MainsSubmission = {
      id: randomUUID(),
      userId,
      questionId: this.resolveQuestionForToday().id,
      answer,
      submittedAt: new Date(),
    };

    const existing = this.submissionsByUser.get(userId) ?? [];
    this.submissionsByUser.set(userId, [submission, ...existing]);
    return submission;
  }

  private resolveQuestionForToday(): MainsDailyQuestion {
    if (dailyQuestionBank.length === 0) {
      throw new AppError('No mains questions configured', 500);
    }

    const now = new Date();
    const dayKey = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return dailyQuestionBank[Math.floor(dayKey / millisecondsPerDay) % dailyQuestionBank.length]!;
  }
}

const defaultMainsService = new MainsService();

export const createMainsService = (options: MainsServiceOptions = {}): MainsService => {
  if (Object.keys(options).length === 0) {
    return defaultMainsService;
  }

  return new MainsService(options);
};
