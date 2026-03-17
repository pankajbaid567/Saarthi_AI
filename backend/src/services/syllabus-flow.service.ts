import { randomUUID } from 'crypto';

import { AppError } from '../errors/app-error.js';
import { createKnowledgeGraphService, type KnowledgeGraphService } from './knowledge-graph.service.js';

type TopicStatus = 'not_started' | 'in_progress' | 'completed';
type OptionKey = 'A' | 'B' | 'C' | 'D';

type TopicProgress = {
  userId: string;
  topicId: string;
  status: TopicStatus;
  completionPercentage: number;
  timeSpentMinutes: number;
  updatedAt: Date;
};

type SyllabusSnapshot = {
  id: string;
  userId: string;
  capturedAt: Date;
  overallCompletionPercentage: number;
  subjects: Array<{
    subjectId: string;
    completionPercentage: number;
  }>;
};

type PracticeQuestion = {
  id: string;
  subjectId: string;
  topicId: string;
  questionText: string;
  options: Record<OptionKey, string>;
  correctOption: OptionKey;
};

type PracticeResponse = {
  questionId: string;
  selectedOption: OptionKey;
  isCorrect: boolean;
  answeredAt: Date;
};

type PracticeSessionMode = 'daily' | 'mixed';
type PracticeSessionStatus = 'active' | 'submitted';

type PracticeSession = {
  id: string;
  userId: string;
  mode: PracticeSessionMode;
  status: PracticeSessionStatus;
  questionIds: string[];
  responses: PracticeResponse[];
  generatedAt: Date;
  submittedAt: Date | null;
};

type PracticeAttemptLog = {
  userId: string;
  sessionId: string;
  questionId: string;
  topicId: string;
  selectedOption: OptionKey;
  isCorrect: boolean;
  attemptedAt: Date;
};

type PracticeGenerationLog = {
  id: string;
  userId: string;
  mode: PracticeSessionMode;
  generatedAt: Date;
  weakQuestions: number;
  strongQuestions: number;
};

type UpdateTopicStatusInput = {
  status: TopicStatus;
  timeSpentMinutes?: number;
};

type GeneratePracticeInput = {
  questionCount?: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_30_MS = 30 * MS_PER_DAY;
const DAYS_7_MS = 7 * MS_PER_DAY;
const WEAK_TOPIC_RATIO = 0.7;

const shuffle = <T>(values: T[]): T[] => {
  const copied = [...values];
  for (let index = copied.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copied[index], copied[randomIndex]] = [copied[randomIndex]!, copied[index]!];
  }

  return copied;
};

const completionPercentageByStatus: Record<TopicStatus, number> = {
  not_started: 0,
  in_progress: 50,
  completed: 100,
};

type SyllabusFlowServiceOptions = {
  knowledgeGraphService?: KnowledgeGraphService;
};

export class SyllabusFlowService {
  private readonly knowledgeGraphService: KnowledgeGraphService;

  private readonly userTopicProgress = new Map<string, Map<string, TopicProgress>>();

  private readonly snapshotsByUser = new Map<string, SyllabusSnapshot[]>();

  private readonly questionsById = new Map<string, PracticeQuestion>();

  private readonly sessionsById = new Map<string, PracticeSession>();

  private readonly latestDailySessionByUser = new Map<string, string>();

  private readonly attemptLogs: PracticeAttemptLog[] = [];

  private readonly generationLogs: PracticeGenerationLog[] = [];

  constructor(options: SyllabusFlowServiceOptions = {}) {
    this.knowledgeGraphService = options.knowledgeGraphService ?? createKnowledgeGraphService();
    this.seedPracticeQuestions();
  }

  getProgress(userId: string) {
    const subjects = this.getSubjectSummaries(userId);
    this.captureWeeklySnapshot(userId, subjects);
    const totalTopics = subjects.reduce((sum, subject) => sum + subject.totalTopics, 0);
    const completedTopics = subjects.reduce((sum, subject) => sum + subject.completedTopics, 0);

    return {
      overallCompletionPercentage: totalTopics === 0 ? 0 : Number(((completedTopics / totalTopics) * 100).toFixed(2)),
      subjects,
    };
  }

  getSubjectProgress(userId: string, subjectId: string) {
    this.knowledgeGraphService.getSubject(subjectId);
    const subject = this.getSubjectSummaries(userId).find((entry) => entry.subjectId === subjectId);

    if (!subject) {
      throw new AppError('Subject not found', 404);
    }

    return subject;
  }

  updateTopicStatus(userId: string, topicId: string, input: UpdateTopicStatusInput) {
    this.knowledgeGraphService.getTopic(topicId);
    const progressMap = this.ensureUserProgress(userId);
    const current = progressMap.get(topicId)!;
    const updated: TopicProgress = {
      ...current,
      status: input.status,
      completionPercentage: completionPercentageByStatus[input.status],
      timeSpentMinutes: current.timeSpentMinutes + (input.timeSpentMinutes ?? 0),
      updatedAt: new Date(),
    };
    progressMap.set(topicId, updated);
    this.captureWeeklySnapshot(userId, this.getSubjectSummaries(userId));

    return {
      topicId: updated.topicId,
      status: updated.status,
      completionPercentage: updated.completionPercentage,
      timeSpentMinutes: updated.timeSpentMinutes,
    };
  }

  getTopicPracticeReady(userId: string, topicId: string) {
    this.knowledgeGraphService.getTopic(topicId);
    const progressMap = this.ensureUserProgress(userId);
    const progress = progressMap.get(topicId)!;

    return {
      topicId,
      practiceReady: progress.status === 'completed',
    };
  }

  generateDailyPractice(userId: string, input: GeneratePracticeInput = {}) {
    const session = this.generatePracticeSession(userId, 'daily', input.questionCount ?? 10);
    this.latestDailySessionByUser.set(userId, session.id);
    return this.toPracticeQueueResponse(session);
  }

  getDailyPracticeQueue(userId: string) {
    const sessionId = this.latestDailySessionByUser.get(userId);
    if (!sessionId) {
      throw new AppError("Today's practice queue not generated", 404);
    }

    const session = this.sessionsById.get(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError("Today's practice queue not found", 404);
    }

    return this.toPracticeQueueResponse(session);
  }

  submitDailyAnswer(userId: string, questionId: string, selectedOption: OptionKey) {
    const sessionId = this.latestDailySessionByUser.get(userId);
    if (!sessionId) {
      throw new AppError("Today's practice queue not generated", 404);
    }

    const session = this.sessionsById.get(sessionId);
    if (!session || session.userId !== userId || session.status !== 'active') {
      throw new AppError('No active daily practice session found', 404);
    }

    if (!session.questionIds.includes(questionId)) {
      throw new AppError('Question not found in active daily session', 404);
    }

    const alreadyAnswered = session.responses.some((response) => response.questionId === questionId);
    if (alreadyAnswered) {
      throw new AppError('Question already answered', 400);
    }

    const question = this.questionsById.get(questionId);
    if (!question) {
      throw new AppError('Question not found', 404);
    }

    const response: PracticeResponse = {
      questionId,
      selectedOption,
      isCorrect: selectedOption === question.correctOption,
      answeredAt: new Date(),
    };
    session.responses.push(response);
    this.attemptLogs.push({
      userId,
      sessionId: session.id,
      questionId,
      topicId: question.topicId,
      selectedOption,
      isCorrect: response.isCorrect,
      attemptedAt: response.answeredAt,
    });

    if (session.responses.length === session.questionIds.length) {
      session.status = 'submitted';
      session.submittedAt = new Date();
    }

    return {
      questionId,
      isCorrect: response.isCorrect,
      correctOption: question.correctOption,
      sessionCompleted: session.status === 'submitted',
      remainingQuestions: session.questionIds.length - session.responses.length,
    };
  }

  getDailyResults(userId: string) {
    const sessionId = this.latestDailySessionByUser.get(userId);
    if (!sessionId) {
      throw new AppError('Daily session not found', 404);
    }

    const session = this.sessionsById.get(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError('Daily session not found', 404);
    }

    if (session.status !== 'submitted') {
      throw new AppError('Daily session not submitted yet', 400);
    }

    return this.toSessionResults(session);
  }

  listPracticeHistory(userId: string) {
    return [...this.sessionsById.values()]
      .filter((session) => session.userId === userId && session.status === 'submitted')
      .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime())
      .map((session) => {
        const results = this.toSessionResults(session);
        return {
          sessionId: session.id,
          mode: session.mode,
          generatedAt: session.generatedAt,
          submittedAt: session.submittedAt,
          score: results.score,
          totalQuestions: results.totalQuestions,
          accuracy: results.accuracy,
        };
      });
  }

  generateMixedPractice(userId: string, input: GeneratePracticeInput = {}) {
    const session = this.generatePracticeSession(userId, 'mixed', input.questionCount ?? 15);
    return this.toPracticeQueueResponse(session);
  }

  private ensureUserProgress(userId: string): Map<string, TopicProgress> {
    const existing = this.userTopicProgress.get(userId);
    if (existing) {
      return existing;
    }

    const created = new Map<string, TopicProgress>();
    const topics = this.knowledgeGraphService.listAllTopics();
    const now = new Date();
    topics.forEach((topic) => {
      created.set(topic.id, {
        userId,
        topicId: topic.id,
        status: 'not_started',
        completionPercentage: 0,
        timeSpentMinutes: 0,
        updatedAt: now,
      });
    });
    this.userTopicProgress.set(userId, created);
    return created;
  }

  private getSubjectSummaries(userId: string) {
    const progressMap = this.ensureUserProgress(userId);
    const subjects = this.knowledgeGraphService.listSubjects();
    const topics = this.knowledgeGraphService.listAllTopics();

    return subjects.map((subject) => {
      const subjectTopics = topics.filter((topic) => topic.subjectId === subject.id);
      const completedTopics = subjectTopics.filter((topic) => progressMap.get(topic.id)!.status === 'completed').length;
      const totalTopics = subjectTopics.length;
      const completionPercentage = totalTopics === 0 ? 0 : Number(((completedTopics / totalTopics) * 100).toFixed(2));

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        totalTopics,
        completedTopics,
        completionPercentage,
        topics: subjectTopics.map((topic) => {
          const progress = progressMap.get(topic.id)!;
          return {
            topicId: topic.id,
            topicName: topic.name,
            parentTopicId: topic.parentTopicId,
            status: progress.status,
            completionPercentage: progress.completionPercentage,
            timeSpentMinutes: progress.timeSpentMinutes,
          };
        }),
      };
    });
  }

  private captureWeeklySnapshot(userId: string, subjects: ReturnType<SyllabusFlowService['getSubjectSummaries']>): void {
    const snapshots = this.snapshotsByUser.get(userId) ?? [];
    const latest = snapshots[0];
    const now = new Date();
    if (latest && now.getTime() - latest.capturedAt.getTime() < DAYS_7_MS) {
      return;
    }

    const totalTopics = subjects.reduce((sum, subject) => sum + subject.totalTopics, 0);
    const completedTopics = subjects.reduce((sum, subject) => sum + subject.completedTopics, 0);
    snapshots.unshift({
      id: randomUUID(),
      userId,
      capturedAt: now,
      overallCompletionPercentage: totalTopics === 0 ? 0 : Number(((completedTopics / totalTopics) * 100).toFixed(2)),
      subjects: subjects.map((subject) => ({
        subjectId: subject.subjectId,
        completionPercentage: subject.completionPercentage,
      })),
    });
    this.snapshotsByUser.set(userId, snapshots);
  }

  private generatePracticeSession(userId: string, mode: PracticeSessionMode, questionCount: number): PracticeSession {
    const progressMap = this.ensureUserProgress(userId);
    const completedTopicIds = [...progressMap.values()]
      .filter((progress) => progress.status === 'completed')
      .map((progress) => progress.topicId);

    if (completedTopicIds.length === 0) {
      throw new AppError('Mark at least one topic as completed to generate practice', 400);
    }

    const cutoff = new Date(Date.now() - DAYS_30_MS);
    const attemptedQuestionIds = new Set(
      this.attemptLogs
        .filter((log) => log.userId === userId && log.attemptedAt >= cutoff)
        .map((log) => log.questionId),
    );

    const availableQuestions = [...this.questionsById.values()].filter(
      (question) => completedTopicIds.includes(question.topicId) && !attemptedQuestionIds.has(question.id),
    );

    if (availableQuestions.length < questionCount) {
      throw new AppError('Not enough eligible non-repeating questions for requested count', 400);
    }

    const weakTopicIds = this.getWeakTopicIds(userId, completedTopicIds);
    const weakSet = new Set(weakTopicIds);
    const weakQuestions = shuffle(availableQuestions.filter((question) => weakSet.has(question.topicId)));
    const strongQuestions = shuffle(availableQuestions.filter((question) => !weakSet.has(question.topicId)));

    const targetWeakCount = Math.round(questionCount * WEAK_TOPIC_RATIO);
    const selectedWeak = weakQuestions.slice(0, Math.min(targetWeakCount, weakQuestions.length));
    const remaining = questionCount - selectedWeak.length;
    const selectedStrong = strongQuestions.slice(0, Math.min(remaining, strongQuestions.length));
    const stillNeeded = questionCount - selectedWeak.length - selectedStrong.length;
    const fallbackPool = shuffle([
      ...weakQuestions.slice(selectedWeak.length),
      ...strongQuestions.slice(selectedStrong.length),
    ]).slice(0, stillNeeded);

    const selected = shuffle([...selectedWeak, ...selectedStrong, ...fallbackPool]);
    if (selected.length < questionCount) {
      throw new AppError('Unable to satisfy requested practice generation', 400);
    }

    const session: PracticeSession = {
      id: randomUUID(),
      userId,
      mode,
      status: 'active',
      questionIds: selected.map((question) => question.id),
      responses: [],
      generatedAt: new Date(),
      submittedAt: null,
    };
    this.sessionsById.set(session.id, session);
    this.generationLogs.unshift({
      id: randomUUID(),
      userId,
      mode,
      generatedAt: session.generatedAt,
      weakQuestions: selected.filter((question) => weakSet.has(question.topicId)).length,
      strongQuestions: selected.filter((question) => !weakSet.has(question.topicId)).length,
    });
    return session;
  }

  private getWeakTopicIds(userId: string, completedTopicIds: string[]): string[] {
    const stats = new Map<string, { correct: number; total: number }>();
    this.attemptLogs
      .filter((log) => log.userId === userId && completedTopicIds.includes(log.topicId))
      .forEach((log) => {
        const current = stats.get(log.topicId) ?? { correct: 0, total: 0 };
        current.total += 1;
        if (log.isCorrect) {
          current.correct += 1;
        }
        stats.set(log.topicId, current);
      });

    if (stats.size === 0) {
      return completedTopicIds.slice(0, Math.max(1, Math.ceil(completedTopicIds.length / 2)));
    }

    return [...stats.entries()]
      .map(([topicId, value]) => ({
        topicId,
        accuracy: value.total === 0 ? 0 : value.correct / value.total,
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .map((entry) => entry.topicId)
      .slice(0, Math.max(1, Math.ceil(stats.size / 2)));
  }

  private toPracticeQueueResponse(session: PracticeSession) {
    return {
      sessionId: session.id,
      mode: session.mode,
      status: session.status,
      generatedAt: session.generatedAt,
      questions: session.questionIds.map((questionId, index) => {
        const question = this.questionsById.get(questionId)!;
        return {
          questionId: question.id,
          questionNumber: index + 1,
          topicId: question.topicId,
          subjectId: question.subjectId,
          questionText: question.questionText,
          options: question.options,
        };
      }),
    };
  }

  private toSessionResults(session: PracticeSession) {
    const correct = session.responses.filter((response) => response.isCorrect).length;
    const totalQuestions = session.questionIds.length;
    const incorrect = session.responses.length - correct;
    return {
      sessionId: session.id,
      mode: session.mode,
      generatedAt: session.generatedAt,
      submittedAt: session.submittedAt,
      totalQuestions,
      answeredQuestions: session.responses.length,
      correct,
      incorrect,
      score: correct,
      accuracy: totalQuestions === 0 ? 0 : Number(((correct / totalQuestions) * 100).toFixed(2)),
      responses: session.responses,
    };
  }

  private seedPracticeQuestions(): void {
    const topics = this.knowledgeGraphService.listAllTopics();
    const options = ['A', 'B', 'C', 'D'] as const;

    topics.forEach((topic) => {
      for (let index = 1; index <= 8; index += 1) {
        const correctOption = options[index % options.length]!;
        const question: PracticeQuestion = {
          id: randomUUID(),
          subjectId: topic.subjectId,
          topicId: topic.id,
          questionText: `Practice question ${index} for ${topic.name}`,
          options: {
            A: `${topic.name} statement ${index}.A`,
            B: `${topic.name} statement ${index}.B`,
            C: `${topic.name} statement ${index}.C`,
            D: `${topic.name} statement ${index}.D`,
          },
          correctOption,
        };
        this.questionsById.set(question.id, question);
      }
    });
  }
}

const defaultSyllabusFlowService = new SyllabusFlowService();

export const createSyllabusFlowService = (options: SyllabusFlowServiceOptions = {}): SyllabusFlowService => {
  if (Object.keys(options).length === 0) {
    return defaultSyllabusFlowService;
  }

  return new SyllabusFlowService(options);
};
