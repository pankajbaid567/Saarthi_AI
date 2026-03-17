import { randomUUID } from 'crypto';

import { AppError } from '../errors/app-error.js';
import { redisClient } from '../lib/redis.js';
import { logger } from '../utils/logger.js';
import { createKnowledgeGraphService, type KnowledgeGraphService } from './knowledge-graph.service.js';

type OptionKey = 'A' | 'B' | 'C' | 'D';
type Difficulty = 'easy' | 'medium' | 'hard';
export type TestType = 'topic_wise' | 'subtopic_wise' | 'mixed' | 'pyq' | 'weak_area' | 'custom';

type MCQQuestion = {
  id: string;
  subjectId: string;
  topicId: string;
  questionText: string;
  options: Record<OptionKey, string>;
  correctOption: OptionKey;
  explanation: string;
  difficulty: Difficulty;
  type: 'standard' | 'pyq';
};

type TestQuestion = {
  id: string;
  questionNumber: number;
  questionText: string;
  options: Record<OptionKey, string>;
  difficulty: Difficulty;
  type: 'standard' | 'pyq';
  topicId: string;
};

type TestResponseInput = {
  questionId: string;
  selectedOption?: OptionKey | null;
  timeTakenSeconds?: number;
  isFlagged?: boolean;
};

type StoredResponse = {
  questionId: string;
  selectedOption: OptionKey | null;
  timeTakenSeconds: number;
  isFlagged: boolean;
  isCorrect: boolean;
};

type TestRecord = {
  id: string;
  userId: string;
  title: string;
  type: TestType;
  questionCount: number;
  timeLimitMinutes: number;
  questionIds: string[];
  status: 'active' | 'submitted';
  score: number | null;
  negativeMarks: number;
  correct: number;
  incorrect: number;
  skipped: number;
  createdAt: Date;
  submittedAt: Date | null;
};

type ActiveSession = {
  testId: string;
  userId: string;
  responses: StoredResponse[];
  savedAt: string;
};

type TestGenerationInput = {
  type: TestType;
  subjectId?: string;
  topicIds?: string[];
  questionCount?: number;
  timeLimitMinutes?: number;
};

type TestGenerationResult = {
  testId: string;
  title: string;
  type: TestType;
  questionCount: number;
  timeLimitMinutes: number;
  questions: TestQuestion[];
};

type TestSummary = {
  id: string;
  title: string;
  type: TestType;
  questionCount: number;
  status: 'active' | 'submitted';
  score: number | null;
  createdAt: Date;
  submittedAt: Date | null;
};

type TestHistoryFilter = {
  type?: TestType;
};

export interface TestSessionStore {
  get(userId: string, testId: string): Promise<ActiveSession | null>;
  set(session: ActiveSession): Promise<void>;
  del(userId: string, testId: string): Promise<void>;
}

const roundToTwoDecimals = (value: number): number => Number(value.toFixed(2));

const shuffle = <T>(values: T[]): T[] => {
  const copied = [...values];
  for (let index = copied.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copied[index], copied[randomIndex]] = [copied[randomIndex]!, copied[index]!];
  }

  return copied;
};

class RedisTestSessionStore implements TestSessionStore {
  private readonly fallbackValues = new Map<string, ActiveSession>();

  private static readonly ttlSeconds = 60 * 60 * 2;

  private redisEnabled = true;

  private buildKey(userId: string, testId: string): string {
    return `tests:active:${userId}:${testId}`;
  }

  async get(userId: string, testId: string): Promise<ActiveSession | null> {
    const key = this.buildKey(userId, testId);
    if (!this.redisEnabled) {
      return this.fallbackValues.get(key) ?? null;
    }

    try {
      const raw = await redisClient.get(key);
      if (!raw) {
        return this.fallbackValues.get(key) ?? null;
      }

      return JSON.parse(raw) as ActiveSession;
    } catch {
      this.redisEnabled = false;
      return this.fallbackValues.get(key) ?? null;
    }
  }

  async set(session: ActiveSession): Promise<void> {
    const key = this.buildKey(session.userId, session.testId);
    this.fallbackValues.set(key, session);
    if (!this.redisEnabled) {
      return;
    }

    try {
      await redisClient.set(key, JSON.stringify(session), 'EX', RedisTestSessionStore.ttlSeconds);
    } catch {
      this.redisEnabled = false;
      logger.warn('Redis unavailable for active test session storage', { key });
    }
  }

  async del(userId: string, testId: string): Promise<void> {
    const key = this.buildKey(userId, testId);
    this.fallbackValues.delete(key);
    if (!this.redisEnabled) {
      return;
    }

    try {
      await redisClient.del(key);
    } catch {
      this.redisEnabled = false;
      logger.warn('Redis unavailable for active test session delete operation', { key });
    }
  }
}

type TestEngineServiceOptions = {
  knowledgeGraphService?: KnowledgeGraphService;
  questions?: MCQQuestion[];
  sessionStore?: TestSessionStore;
};

export class TestEngineService {
  private readonly knowledgeGraphService: KnowledgeGraphService;

  private readonly questionsById = new Map<string, MCQQuestion>();

  private readonly testsById = new Map<string, TestRecord>();

  private readonly responsesByTestId = new Map<string, StoredResponse[]>();

  private readonly sessionStore: TestSessionStore;

  constructor(options: TestEngineServiceOptions = {}) {
    this.knowledgeGraphService = options.knowledgeGraphService ?? createKnowledgeGraphService();
    const questions = options.questions ?? this.buildDefaultQuestions();
    questions.forEach((question) => {
      this.questionsById.set(question.id, question);
    });
    this.sessionStore = options.sessionStore ?? new RedisTestSessionStore();
  }

  async generateTest(userId: string, input: TestGenerationInput): Promise<TestGenerationResult> {
    const questionCount = input.questionCount ?? (input.type === 'mixed' ? 100 : 30);
    const timeLimitMinutes = input.timeLimitMinutes ?? (input.type === 'mixed' ? 120 : 45);
    const pool = this.selectQuestionPool(userId, input);

    if (pool.length < questionCount) {
      throw new AppError('Not enough questions available for selected criteria', 400);
    }

    const selectedQuestions = shuffle(pool)
      .slice(0, questionCount)
      .map((question, index) => this.toTestQuestion(question, index + 1));

    const testId = randomUUID();
    const testRecord: TestRecord = {
      id: testId,
      userId,
      title: this.buildTestTitle(input.type, questionCount),
      type: input.type,
      questionCount,
      timeLimitMinutes,
      questionIds: selectedQuestions.map((question) => question.id),
      status: 'active',
      score: null,
      negativeMarks: 0,
      correct: 0,
      incorrect: 0,
      skipped: questionCount,
      createdAt: new Date(),
      submittedAt: null,
    };

    this.testsById.set(testId, testRecord);
    this.responsesByTestId.set(testId, []);
    await this.sessionStore.set({
      testId,
      userId,
      responses: [],
      savedAt: new Date().toISOString(),
    });

    return {
      testId,
      title: testRecord.title,
      type: testRecord.type,
      questionCount,
      timeLimitMinutes,
      questions: selectedQuestions,
    };
  }

  async submitTest(userId: string, testId: string, responses: TestResponseInput[]) {
    const test = this.getOwnedTest(userId, testId);
    if (test.status === 'submitted') {
      throw new AppError('Test already submitted', 400);
    }

    const responsesByQuestionId = new Map<string, StoredResponse>();
    for (const response of responses) {
      const question = this.questionsById.get(response.questionId);
      if (!question || !test.questionIds.includes(response.questionId)) {
        throw new AppError('Invalid question response in submission', 400);
      }

      const selectedOption = response.selectedOption ?? null;
      const isCorrect = selectedOption !== null && selectedOption === question.correctOption;
      responsesByQuestionId.set(response.questionId, {
        questionId: response.questionId,
        selectedOption,
        timeTakenSeconds: response.timeTakenSeconds ?? 0,
        isFlagged: response.isFlagged ?? false,
        isCorrect,
      });
    }

    const storedResponses: StoredResponse[] = test.questionIds.map((questionId) => {
      return (
        responsesByQuestionId.get(questionId) ?? {
          questionId,
          selectedOption: null,
          timeTakenSeconds: 0,
          isFlagged: false,
          isCorrect: false,
        }
      );
    });

    const correct = storedResponses.filter((response) => response.isCorrect).length;
    const incorrect = storedResponses.filter(
      (response) => response.selectedOption !== null && !response.isCorrect,
    ).length;
    const skipped = storedResponses.length - correct - incorrect;
    const negativeMarks = roundToTwoDecimals(incorrect * 0.33);
    const score = roundToTwoDecimals(correct - negativeMarks);

    test.status = 'submitted';
    test.correct = correct;
    test.incorrect = incorrect;
    test.skipped = skipped;
    test.negativeMarks = negativeMarks;
    test.score = score;
    test.submittedAt = new Date();
    this.responsesByTestId.set(test.id, storedResponses);

    await this.sessionStore.del(userId, test.id);

    const totalTimeTaken = storedResponses.reduce((sum, item) => sum + item.timeTakenSeconds, 0);
    return {
      testId: test.id,
      score,
      totalMarks: test.questionCount,
      correct,
      incorrect,
      skipped,
      negativeMarks,
      accuracy: test.questionCount === 0 ? 0 : roundToTwoDecimals((correct / test.questionCount) * 100),
      timeTakenSeconds: totalTimeTaken,
      avgTimePerQuestion: test.questionCount === 0 ? 0 : roundToTwoDecimals(totalTimeTaken / test.questionCount),
    };
  }

  async getTest(userId: string, testId: string) {
    const test = this.getOwnedTest(userId, testId);
    const responses =
      test.status === 'submitted'
        ? this.responsesByTestId.get(test.id) ?? []
        : ((await this.sessionStore.get(userId, test.id))?.responses ?? []);

    return {
      id: test.id,
      title: test.title,
      type: test.type,
      status: test.status,
      questionCount: test.questionCount,
      timeLimitMinutes: test.timeLimitMinutes,
      questions: test.questionIds.map((questionId, index) => this.toTestQuestion(this.questionsById.get(questionId)!, index + 1)),
      responses,
    };
  }

  getResults(userId: string, testId: string) {
    const test = this.getOwnedTest(userId, testId);
    if (test.status !== 'submitted') {
      throw new AppError('Test has not been submitted yet', 400);
    }

    const responsesByQuestionId = new Map(
      (this.responsesByTestId.get(test.id) ?? []).map((response) => [response.questionId, response]),
    );
    const topicStats = new Map<string, { correct: number; total: number }>();

    const questionResults = test.questionIds.map((questionId, index) => {
      const question = this.questionsById.get(questionId)!;
      const response = responsesByQuestionId.get(questionId);
      const currentTopicStats = topicStats.get(question.topicId) ?? { correct: 0, total: 0 };
      currentTopicStats.total += 1;
      if (response?.isCorrect) {
        currentTopicStats.correct += 1;
      }
      topicStats.set(question.topicId, currentTopicStats);

      return {
        questionNumber: index + 1,
        questionId: question.id,
        questionText: question.questionText,
        selectedOption: response?.selectedOption ?? null,
        correctOption: question.correctOption,
        isCorrect: response?.isCorrect ?? false,
        explanation: question.explanation,
      };
    });

    const weakAreas = [...topicStats.entries()]
      .map(([topicId, stats]) => ({
        topicId,
        accuracy: stats.total === 0 ? 0 : (stats.correct / stats.total) * 100,
      }))
      .filter((entry) => entry.accuracy < 60)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 5);

    return {
      testId: test.id,
      score: test.score,
      totalMarks: test.questionCount,
      correct: test.correct,
      incorrect: test.incorrect,
      skipped: test.skipped,
      negativeMarks: test.negativeMarks,
      accuracy: test.questionCount === 0 ? 0 : roundToTwoDecimals((test.correct / test.questionCount) * 100),
      weakAreas,
      questions: questionResults,
    };
  }

  listHistory(userId: string, filter: TestHistoryFilter = {}): TestSummary[] {
    return [...this.testsById.values()]
      .filter((test) => test.userId === userId)
      .filter((test) => (filter.type ? test.type === filter.type : true))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((test) => ({
        id: test.id,
        title: test.title,
        type: test.type,
        questionCount: test.questionCount,
        status: test.status,
        score: test.score,
        createdAt: test.createdAt,
        submittedAt: test.submittedAt,
      }));
  }

  private getOwnedTest(userId: string, testId: string): TestRecord {
    const test = this.testsById.get(testId);
    if (!test || test.userId !== userId) {
      throw new AppError('Test not found', 404);
    }

    return test;
  }

  private toTestQuestion(question: MCQQuestion, questionNumber: number): TestQuestion {
    return {
      id: question.id,
      questionNumber,
      questionText: question.questionText,
      options: question.options,
      difficulty: question.difficulty,
      type: question.type,
      topicId: question.topicId,
    };
  }

  private selectQuestionPool(userId: string, input: TestGenerationInput): MCQQuestion[] {
    const allQuestions = [...this.questionsById.values()];
    const topicIds = new Set(input.topicIds ?? []);
    const topics = this.knowledgeGraphService.listAllTopics();
    const topicIdsForWeakArea = this.getWeakAreaTopicIds(userId);
    switch (input.type) {
      case 'topic_wise':
      case 'custom':
        if (topicIds.size === 0) {
          throw new AppError('At least one topicId is required', 400);
        }
        return allQuestions.filter((question) => topicIds.has(question.topicId));
      case 'subtopic_wise':
        if (topicIds.size > 0) {
          return allQuestions.filter((question) => topicIds.has(question.topicId));
        }
        return allQuestions.filter((question) => {
          const topic = topics.find((item) => item.id === question.topicId);
          return Boolean(topic?.parentTopicId);
        });
      case 'mixed':
        return allQuestions.filter((question) => (input.subjectId ? question.subjectId === input.subjectId : true));
      case 'pyq':
        return allQuestions.filter((question) => question.type === 'pyq');
      case 'weak_area':
        if (topicIdsForWeakArea.length > 0) {
          const weakTopicIds = new Set(topicIdsForWeakArea);
          return allQuestions.filter((question) => weakTopicIds.has(question.topicId));
        }

        return allQuestions;
      default:
        return allQuestions;
    }
  }

  private getWeakAreaTopicIds(userId: string): string[] {
    const topicStats = new Map<string, { correct: number; total: number }>();
    const submittedTests = [...this.testsById.values()].filter(
      (test) => test.userId === userId && test.status === 'submitted',
    );

    submittedTests.forEach((test) => {
      const responsesByQuestionId = new Map(
        (this.responsesByTestId.get(test.id) ?? []).map((response) => [response.questionId, response]),
      );
      test.questionIds.forEach((questionId) => {
        const question = this.questionsById.get(questionId);
        if (!question) {
          return;
        }
        const current = topicStats.get(question.topicId) ?? { correct: 0, total: 0 };
        current.total += 1;
        if (responsesByQuestionId.get(questionId)?.isCorrect) {
          current.correct += 1;
        }
        topicStats.set(question.topicId, current);
      });
    });

    return [...topicStats.entries()]
      .map(([topicId, stats]) => ({ topicId, accuracy: stats.total === 0 ? 0 : stats.correct / stats.total }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .filter((entry) => entry.accuracy < 0.6)
      .slice(0, 5)
      .map((entry) => entry.topicId);
  }

  private buildTestTitle(type: TestType, questionCount: number): string {
    const prefixes: Record<TestType, string> = {
      topic_wise: 'Topic Wise Test',
      subtopic_wise: 'Subtopic Wise Test',
      mixed: 'Mixed Practice Test',
      pyq: 'PYQ Test',
      weak_area: 'AI Weak Area Test',
      custom: 'Custom Practice Test',
    };

    return `${prefixes[type]} - ${questionCount} Questions`;
  }

  private buildDefaultQuestions(): MCQQuestion[] {
    const topics = this.knowledgeGraphService.listAllTopics();
    return topics.flatMap((topic, topicIndex) => {
      const difficulties: Difficulty[] = ['easy', 'medium', 'medium', 'hard', 'medium'];
      return Array.from({ length: 5 }, (_value, index) => {
        const optionSet: Record<OptionKey, string> = {
          A: `${topic.name} statement ${index + 1}.A`,
          B: `${topic.name} statement ${index + 1}.B`,
          C: `${topic.name} statement ${index + 1}.C`,
          D: `${topic.name} statement ${index + 1}.D`,
        };
        const correctOption = (['A', 'B', 'C', 'D'][index % 4] ?? 'A') as OptionKey;
        const isPyq = index === 0 || (topicIndex + index) % 7 === 0;
        return {
          id: randomUUID(),
          subjectId: topic.subjectId,
          topicId: topic.id,
          questionText: `Question ${index + 1} on ${topic.name}`,
          options: optionSet,
          correctOption,
          explanation: `Explanation for ${topic.name} question ${index + 1}.`,
          difficulty: difficulties[index]!,
          type: isPyq ? 'pyq' : 'standard',
        };
      });
    });
  }
}

const defaultTestEngineService = new TestEngineService();

export const createTestEngineService = (options: TestEngineServiceOptions = {}): TestEngineService => {
  if (Object.keys(options).length === 0) {
    return defaultTestEngineService;
  }

  return new TestEngineService(options);
};
