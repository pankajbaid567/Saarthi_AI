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

  getGateStatus(userId: string): {
    date: string;
    requiredMcqs: number;
    attemptedMcqs: number;
    isUnlocked: boolean;
    overrideApplied: boolean;
  } {
    const dateKey = toDateKey(new Date());
    const override = this.gateOverrides.get(`${userId}:${dateKey}`);
    const attemptedMcqs = this.testEngineService.getDailyAttemptedMcqCount(userId);
    const isUnlocked = Boolean(override) || attemptedMcqs >= this.requiredDailyMcqAttempts;

    return {
      date: dateKey,
      requiredMcqs: this.requiredDailyMcqAttempts,
      attemptedMcqs,
      isUnlocked,
      overrideApplied: Boolean(override),
    };
  }

  getDailyQuestion(userId: string): {
    gateStatus: ReturnType<MainsService['getGateStatus']>;
    question: MainsDailyQuestion | null;
  } {
    const gateStatus = this.getGateStatus(userId);
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

  submitDailyAnswer(userId: string, answer: string): MainsSubmission {
    const { isUnlocked } = this.getGateStatus(userId);
    if (!isUnlocked) {
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
import { createKnowledgeGraphService, type KnowledgeGraphService } from './knowledge-graph.service.js';

export type MainsQuestionType = 'gs' | 'essay' | 'ethics' | 'optional';
export type MainsQuestionSource = 'pyq' | 'coaching' | 'ai_generated';

export type MainsQuestion = {
  id: string;
  topicId: string;
  type: MainsQuestionType;
  source: MainsQuestionSource;
  marks: number;
  questionText: string;
  modelAnswer: string | null;
  suggestedWordLimit: number;
  year: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateMainsQuestionInput = Omit<MainsQuestion, 'id' | 'createdAt' | 'updatedAt'>;

type ListMainsQuestionsFilters = {
  topicId?: string;
  type?: MainsQuestionType;
  source?: MainsQuestionSource;
  marks?: number;
  search?: string;
  limit?: number;
  offset?: number;
};

type MainsServiceOptions = {
  knowledgeGraphService?: KnowledgeGraphService;
  seedData?: boolean;
};

const mainsTypes: MainsQuestionType[] = ['gs', 'essay', 'ethics', 'optional'];
const mainsSources: MainsQuestionSource[] = ['pyq', 'coaching', 'ai_generated'];
const mainsMarks = [10, 12, 15] as const;

export class MainsService {
  private readonly questions = new Map<string, MainsQuestion>();

  private readonly knowledgeGraphService: KnowledgeGraphService;

  constructor(options: MainsServiceOptions = {}) {
    this.knowledgeGraphService = options.knowledgeGraphService ?? createKnowledgeGraphService();
    const shouldSeedData = options.seedData ?? true;
    if (shouldSeedData) {
      this.seedInitialQuestions();
    }
  }

  listQuestions(filters: ListMainsQuestionsFilters = {}): { total: number; items: MainsQuestion[] } {
    const normalizedSearch = filters.search?.trim().toLowerCase();
    const filtered = [...this.questions.values()]
      .filter((question) => (filters.topicId ? question.topicId === filters.topicId : true))
      .filter((question) => (filters.type ? question.type === filters.type : true))
      .filter((question) => (filters.source ? question.source === filters.source : true))
      .filter((question) => (filters.marks ? question.marks === filters.marks : true))
      .filter((question) =>
        normalizedSearch ? question.questionText.toLowerCase().includes(normalizedSearch) : true,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 20;
    return {
      total: filtered.length,
      items: filtered.slice(offset, offset + limit),
    };
  }

  getQuestionById(id: string): MainsQuestion {
    const question = this.questions.get(id);
    if (!question) {
      throw new AppError('Mains question not found', 404);
    }
    return question;
  }

  createQuestion(input: CreateMainsQuestionInput): MainsQuestion {
    this.knowledgeGraphService.getTopic(input.topicId);

    const now = new Date();
    const question: MainsQuestion = {
      id: randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    this.questions.set(question.id, question);
    return question;
  }

  private seedInitialQuestions(): void {
    if (this.questions.size > 0) {
      return;
    }

    const topics = this.knowledgeGraphService.listAllTopics();
    topics.forEach((topic, topicIndex) => {
      for (let questionIndex = 0; questionIndex < 3; questionIndex += 1) {
        const type = mainsTypes[(topicIndex + questionIndex) % mainsTypes.length]!;
        const source = mainsSources[(topicIndex + questionIndex) % mainsSources.length]!;
        const marks = mainsMarks[questionIndex % mainsMarks.length]!;
        const now = new Date();
        const question: MainsQuestion = {
          id: randomUUID(),
          topicId: topic.id,
          type,
          source,
          marks,
          questionText: `${topic.name}: Critically examine the major developments and assess their implications for policy and governance.`,
          modelAnswer: `Model answer for ${topic.name} covering introduction, analysis, and way forward.`,
          suggestedWordLimit: marks === 15 ? 300 : 250,
          year: source === 'pyq' ? 2015 + ((topicIndex + questionIndex) % 11) : null,
          createdAt: now,
          updatedAt: now,
        };

        this.questions.set(question.id, question);
      }
    });
  }
}

const defaultMainsService = new MainsService();

export const createMainsService = (options: MainsServiceOptions = {}): MainsService => {
  if (Object.keys(options).length === 0) {
    return defaultMainsService;
  }

  return new MainsService(options);
};
