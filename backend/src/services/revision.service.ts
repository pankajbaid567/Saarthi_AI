import { randomUUID } from 'crypto';

import { AppError } from '../errors/app-error.js';
import type { ContentNode, KnowledgeGraphService } from './knowledge-graph.service.js';
import { createKnowledgeGraphService } from './knowledge-graph.service.js';

type RecallQuestionType = 'concept_recall' | 'comparison' | 'factual' | 'application';
type TopicPriority = 'urgent' | 'due' | 'upcoming';
type FlashcardRating = 'easy' | 'good' | 'hard' | 'forgot';

type ActiveRecallQuestionRecord = {
  id: string;
  sessionId: string;
  userId: string;
  topicId: string;
  type: RecallQuestionType;
  questionText: string;
  expectedAnswer: string;
  createdAt: Date;
};

type ActiveRecallAnswerRecord = {
  questionId: string;
  userAnswer: string;
  confidenceLevel: number | null;
  score: number;
  answeredAt: Date;
};

type ActiveRecallSessionRecord = {
  id: string;
  userId: string;
  topicIds: string[];
  questionIds: string[];
  startedAt: Date;
  completedAt: Date | null;
};

type SprintRecord = {
  id: string;
  userId: string;
  durationMinutes: 15 | 30 | 45;
  crashMode: boolean;
  daysRemaining: number | null;
  topicIds: string[];
  startedAt: Date;
  completedAt: Date | null;
  notes: string | null;
};

type FlashcardRecord = {
  id: string;
  userId: string;
  topicId: string;
  front: string;
  back: string;
  source: 'auto' | 'manual';
  createdAt: Date;
  lastReviewedAt: Date | null;
  nextReviewAt: Date;
  lastRating: FlashcardRating | null;
};

type RevisionServiceOptions = {
  knowledgeGraphService?: KnowledgeGraphService;
};

const recallTypes: RecallQuestionType[] = ['concept_recall', 'comparison', 'factual', 'application'];
const priorityByRetention = (retentionScore: number): TopicPriority => {
  if (retentionScore < 40) {
    return 'urgent';
  }
  if (retentionScore < 70) {
    return 'due';
  }
  return 'upcoming';
};

const nextReviewDaysByRating: Record<FlashcardRating, number> = {
  easy: 7,
  good: 3,
  hard: 1,
  forgot: 1,
};

const addDays = (value: Date, days: number): Date => {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const dayKey = (value: Date): string => value.toISOString().slice(0, 10);

const compareDayKey = (first: string, second: string): number => {
  if (first < second) {
    return -1;
  }
  if (first > second) {
    return 1;
  }
  return 0;
};

const defaultExpectedAnswer = (topicName: string, type: RecallQuestionType): string => {
  switch (type) {
    case 'concept_recall':
      return `${topicName} can be recalled by defining it clearly, outlining the core dimensions, and adding one exam-focused example.`;
    case 'comparison':
      return `Compare ${topicName} across purpose, scope, and practical outcome, and conclude with one key differentiator relevant for UPSC answers.`;
    case 'application':
      return `Apply ${topicName} to a real governance or policy scenario and justify the outcome using conceptual reasoning.`;
    case 'factual':
      return `State two to three high-yield facts linked to ${topicName}, including one constitutional or policy reference if applicable.`;
  }
};

const retentionFromTopic = (topicId: string): number => {
  const score = topicId
    .replace(/-/g, '')
    .split('')
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return 25 + (score % 71);
};

const scoreAnswer = (userAnswer: string, expectedAnswer: string, confidenceLevel: number | null): number => {
  const normalizedAnswer = userAnswer.trim();
  if (!normalizedAnswer) {
    return 0;
  }

  const expectedWords = expectedAnswer
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length >= 5);
  const answerWords = new Set(
    normalizedAnswer
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length >= 3),
  );

  const overlap = expectedWords.filter((word) => answerWords.has(word)).length;
  const lexicalScore = expectedWords.length === 0 ? 50 : Math.min(100, Math.round((overlap / expectedWords.length) * 100));
  const confidenceBoost = confidenceLevel === null ? 0 : Math.max(-10, Math.min(10, (confidenceLevel - 3) * 4));
  return Math.max(0, Math.min(100, lexicalScore + confidenceBoost));
};

const toQuestionText = (topicName: string, type: RecallQuestionType): string => {
  switch (type) {
    case 'concept_recall':
      return `In your own words, explain ${topicName} and why it matters in exam answers.`;
    case 'comparison':
      return `Compare ${topicName} with a closely related concept and highlight the exam-relevant difference.`;
    case 'application':
      return `How would you apply ${topicName} in a current affairs or governance scenario?`;
    case 'factual':
      return `List the most important facts a UPSC aspirant should retain about ${topicName}.`;
  }
};

export class RevisionService {
  private readonly knowledgeGraphService: KnowledgeGraphService;

  private readonly activeRecallQuestions = new Map<string, ActiveRecallQuestionRecord>();

  private readonly activeRecallSessions = new Map<string, ActiveRecallSessionRecord>();

  private readonly activeRecallAnswers = new Map<string, ActiveRecallAnswerRecord>();

  private readonly sprintSessions = new Map<string, SprintRecord>();

  private readonly flashcards = new Map<string, FlashcardRecord>();

  private readonly revisionActivityByUser = new Map<string, Set<string>>();

  constructor(options: RevisionServiceOptions = {}) {
    this.knowledgeGraphService = options.knowledgeGraphService ?? createKnowledgeGraphService();
  }

  startActiveRecallSession(
    userId: string,
    input: { topicIds: string[]; questionCount: number; types?: RecallQuestionType[] },
  ): { sessionId: string; questions: ActiveRecallQuestionRecord[]; totalQuestions: number } {
    const requestedTypes = input.types && input.types.length > 0 ? input.types : recallTypes;
    const selectedTopics = input.topicIds.map((topicId) => this.knowledgeGraphService.getTopic(topicId));
    const sessionId = randomUUID();
    const questions: ActiveRecallQuestionRecord[] = [];

    for (let index = 0; index < input.questionCount; index += 1) {
      const topic = selectedTopics[index % selectedTopics.length];
      const type = requestedTypes[index % requestedTypes.length];
      const id = randomUUID();
      const question: ActiveRecallQuestionRecord = {
        id,
        sessionId,
        userId,
        topicId: topic.id,
        type,
        questionText: toQuestionText(topic.name, type),
        expectedAnswer: defaultExpectedAnswer(topic.name, type),
        createdAt: new Date(),
      };
      this.activeRecallQuestions.set(question.id, question);
      questions.push(question);
    }

    this.activeRecallSessions.set(sessionId, {
      id: sessionId,
      userId,
      topicIds: input.topicIds,
      questionIds: questions.map((question) => question.id),
      startedAt: new Date(),
      completedAt: null,
    });
    this.markActivity(userId);

    return {
      sessionId,
      questions,
      totalQuestions: questions.length,
    };
  }

  submitActiveRecallAnswer(
    userId: string,
    sessionId: string,
    input: { questionId: string; userAnswer: string; confidenceLevel?: number },
  ): { questionId: string; score: number } {
    const session = this.getSessionForUser(userId, sessionId);
    if (!session.questionIds.includes(input.questionId)) {
      throw new AppError('Question does not belong to session', 400);
    }
    const question = this.activeRecallQuestions.get(input.questionId);
    if (!question) {
      throw new AppError('Question not found', 404);
    }

    const confidenceLevel = input.confidenceLevel ?? null;
    const score = scoreAnswer(input.userAnswer, question.expectedAnswer, confidenceLevel);
    this.activeRecallAnswers.set(`${sessionId}:${input.questionId}`, {
      questionId: input.questionId,
      userAnswer: input.userAnswer,
      confidenceLevel,
      score,
      answeredAt: new Date(),
    });
    this.markActivity(userId);

    return {
      questionId: input.questionId,
      score,
    };
  }

  getActiveRecallResults(userId: string, sessionId: string): {
    sessionId: string;
    totalQuestions: number;
    answeredQuestions: number;
    averageScore: number;
    recallDelta: number;
    results: Array<{
      questionId: string;
      type: RecallQuestionType;
      score: number | null;
      confidenceLevel: number | null;
      topicId: string;
    }>;
  } {
    const session = this.getSessionForUser(userId, sessionId);
    const results = session.questionIds.map((questionId) => {
      const question = this.activeRecallQuestions.get(questionId);
      if (!question) {
        throw new AppError('Question not found', 404);
      }
      const answer = this.activeRecallAnswers.get(`${sessionId}:${questionId}`) ?? null;
      return {
        questionId,
        type: question.type,
        topicId: question.topicId,
        score: answer?.score ?? null,
        confidenceLevel: answer?.confidenceLevel ?? null,
      };
    });

    const scored = results.filter((result) => result.score !== null).map((result) => result.score as number);
    const answeredQuestions = scored.length;
    const averageScore = answeredQuestions === 0 ? 0 : Number((scored.reduce((sum, score) => sum + score, 0) / answeredQuestions).toFixed(2));
    const baseline = 45;
    const recallDelta = Number((averageScore - baseline).toFixed(2));

    if (answeredQuestions === results.length && session.completedAt === null) {
      session.completedAt = new Date();
      this.activeRecallSessions.set(sessionId, session);
    }

    return {
      sessionId,
      totalQuestions: session.questionIds.length,
      answeredQuestions,
      averageScore,
      recallDelta,
      results,
    };
  }

  startSprint(
    userId: string,
    input: { durationMinutes: 15 | 30 | 45; subjectId?: string; crashMode?: boolean; daysRemaining?: number },
  ): {
    sprintId: string;
    durationMinutes: 15 | 30 | 45;
    crashMode: boolean;
    acceleratedScheduling: boolean;
    dailyTargetTopics: number | null;
    topics: Array<{
      topicId: string;
      topicName: string;
      priority: TopicPriority;
      retentionScore: number;
      microNoteTier: '30sec' | '2min' | '5min';
    }>;
    totalTopics: number;
    startedAt: Date;
  } {
    const allTopics = this.knowledgeGraphService
      .listAllTopics()
      .filter((topic) => !input.subjectId || topic.subjectId === input.subjectId)
      .map((topic) => ({
        topic,
        retentionScore: retentionFromTopic(topic.id),
      }))
      .sort((first, second) => first.retentionScore - second.retentionScore);

    if (allTopics.length === 0) {
      throw new AppError('No topics available for sprint', 400);
    }

    const topicLimit = input.durationMinutes === 15 ? 4 : input.durationMinutes === 30 ? 8 : 12;
    const selected = allTopics.slice(0, topicLimit).map(({ topic, retentionScore }) => ({
      topicId: topic.id,
      topicName: topic.name,
      priority: priorityByRetention(retentionScore),
      retentionScore,
      microNoteTier: retentionScore < 40 ? ('2min' as const) : retentionScore < 70 ? ('30sec' as const) : ('5min' as const),
    }));

    const sprintId = randomUUID();
    const crashMode = Boolean(input.crashMode);
    const daysRemaining = crashMode ? (input.daysRemaining ?? 30) : null;
    const dailyTargetTopics = crashMode ? Math.max(1, Math.ceil(allTopics.length / (daysRemaining ?? 30))) : null;

    this.sprintSessions.set(sprintId, {
      id: sprintId,
      userId,
      durationMinutes: input.durationMinutes,
      crashMode,
      daysRemaining,
      topicIds: selected.map((topic) => topic.topicId),
      startedAt: new Date(),
      completedAt: null,
      notes: null,
    });
    this.markActivity(userId);

    return {
      sprintId,
      durationMinutes: input.durationMinutes,
      crashMode,
      acceleratedScheduling: crashMode,
      dailyTargetTopics,
      topics: selected,
      totalTopics: selected.length,
      startedAt: new Date(),
    };
  }

  completeSprint(
    userId: string,
    sprintId: string,
    input?: { completedTopicIds?: string[]; notes?: string },
  ): {
    sprintId: string;
    completedTopics: number;
    totalTopics: number;
    completionRate: number;
    summary: string;
    completedAt: Date;
  } {
    const sprint = this.sprintSessions.get(sprintId);
    if (!sprint || sprint.userId !== userId) {
      throw new AppError('Sprint not found', 404);
    }

    const completedTopicIds = input?.completedTopicIds?.filter((topicId) => sprint.topicIds.includes(topicId)) ?? sprint.topicIds;
    const completedTopics = completedTopicIds.length;
    const totalTopics = sprint.topicIds.length;
    const completionRate = totalTopics === 0 ? 0 : Number(((completedTopics / totalTopics) * 100).toFixed(2));

    sprint.completedAt = new Date();
    sprint.notes = input?.notes ?? null;
    this.sprintSessions.set(sprintId, sprint);
    this.markActivity(userId);

    return {
      sprintId,
      completedTopics,
      totalTopics,
      completionRate,
      summary: completionRate >= 75 ? 'Strong sprint execution' : 'Sprint completed. Consider shorter follow-up revision.',
      completedAt: sprint.completedAt,
    };
  }

  listSprintHistory(userId: string): Array<{
    sprintId: string;
    durationMinutes: number;
    crashMode: boolean;
    startedAt: Date;
    completedAt: Date | null;
    totalTopics: number;
  }> {
    return [...this.sprintSessions.values()]
      .filter((session) => session.userId === userId)
      .sort((first, second) => second.startedAt.getTime() - first.startedAt.getTime())
      .map((session) => ({
        sprintId: session.id,
        durationMinutes: session.durationMinutes,
        crashMode: session.crashMode,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        totalTopics: session.topicIds.length,
      }));
  }

  listFlashcards(
    userId: string,
    query: { topicId?: string; subjectId?: string; due?: boolean; limit?: number },
  ): Array<{
    id: string;
    topicId: string;
    front: string;
    back: string;
    source: 'auto' | 'manual';
    nextReviewAt: Date;
    lastRating: FlashcardRating | null;
  }> {
    this.ensureAutoFlashcards(userId);
    const now = new Date();
    const eligibleTopicIds = new Set(
      this.knowledgeGraphService
        .listAllTopics()
        .filter((topic) => !query.subjectId || topic.subjectId === query.subjectId)
        .map((topic) => topic.id),
    );

    return [...this.flashcards.values()]
      .filter((card) => card.userId === userId)
      .filter((card) => !query.topicId || card.topicId === query.topicId)
      .filter((card) => (query.subjectId ? eligibleTopicIds.has(card.topicId) : true))
      .filter((card) => (query.due ? card.nextReviewAt.getTime() <= now.getTime() : true))
      .sort((first, second) => first.nextReviewAt.getTime() - second.nextReviewAt.getTime())
      .slice(0, query.limit ?? 30)
      .map((card) => ({
        id: card.id,
        topicId: card.topicId,
        front: card.front,
        back: card.back,
        source: card.source,
        nextReviewAt: card.nextReviewAt,
        lastRating: card.lastRating,
      }));
  }

  createManualFlashcard(userId: string, input: { topicId: string; front: string; back: string }): FlashcardRecord {
    this.knowledgeGraphService.getTopic(input.topicId);
    const now = new Date();
    const card: FlashcardRecord = {
      id: randomUUID(),
      userId,
      topicId: input.topicId,
      front: input.front,
      back: input.back,
      source: 'manual',
      createdAt: now,
      lastReviewedAt: null,
      nextReviewAt: addDays(now, nextReviewDaysByRating.good),
      lastRating: null,
    };
    this.flashcards.set(card.id, card);
    this.markActivity(userId);
    return card;
  }

  getPredictions(userId: string): {
    predictedToForget: Array<{
      topicId: string;
      topicName: string;
      currentRetention: number;
      predictedRetentionIn7Days: number;
      decayRate: number;
      recommendation: string;
      alert: 'high' | 'moderate';
    }>;
    alerts: Array<{ topicId: string; topicName: string; message: string; severity: 'high' | 'moderate' }>;
  } {
    const predictedToForget = this.knowledgeGraphService
      .listAllTopics()
      .map((topic) => {
        const currentRetention = retentionFromTopic(topic.id);
        const decayRate = currentRetention < 40 ? 0.8 : currentRetention < 60 ? 0.65 : 0.45;
        const predictedRetentionIn7Days = Math.max(0, Math.round(currentRetention - decayRate * 30));
        const alert = predictedRetentionIn7Days < 35 ? ('high' as const) : ('moderate' as const);
        return {
          topicId: topic.id,
          topicName: topic.name,
          currentRetention,
          predictedRetentionIn7Days,
          decayRate,
          recommendation:
            predictedRetentionIn7Days < 35
              ? 'Review within 24-48 hours to avoid rapid forgetting.'
              : 'Review in this week to maintain retention.',
          alert,
        };
      })
      .filter((entry) => entry.predictedRetentionIn7Days < 50)
      .sort((first, second) => first.predictedRetentionIn7Days - second.predictedRetentionIn7Days);

    const alerts = predictedToForget.map((entry) => ({
      topicId: entry.topicId,
      topicName: entry.topicName,
      severity: entry.alert,
      message:
        entry.alert === 'high'
          ? 'Retention is rapidly declining; prioritize this topic now.'
          : 'Retention is declining; schedule a revision this week.',
    }));

    this.markActivity(userId);
    return {
      predictedToForget,
      alerts,
    };
  }

  getStreaks(userId: string): {
    current: number;
    longest: number;
    lastRevisionDate: string | null;
    graceDaysRemaining: number;
    history: string[];
  } {
    const activity = [...(this.revisionActivityByUser.get(userId) ?? new Set<string>())].sort(compareDayKey);
    if (activity.length === 0) {
      return {
        current: 0,
        longest: 0,
        lastRevisionDate: null,
        graceDaysRemaining: 1,
        history: [],
      };
    }

    const currentDay = dayKey(new Date());
    const lastDay = activity.at(-1) as string;
    const lastDate = new Date(`${lastDay}T00:00:00.000Z`);
    const todayDate = new Date(`${currentDay}T00:00:00.000Z`);
    const gapDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / 86_400_000);
    const graceDaysRemaining = gapDays <= 1 ? 1 - gapDays : 0;

    let longest = 1;
    let running = 1;
    for (let index = 1; index < activity.length; index += 1) {
      const previous = new Date(`${activity[index - 1]}T00:00:00.000Z`);
      const current = new Date(`${activity[index]}T00:00:00.000Z`);
      const delta = Math.floor((current.getTime() - previous.getTime()) / 86_400_000);
      if (delta <= 2) {
        running += 1;
      } else {
        longest = Math.max(longest, running);
        running = 1;
      }
    }
    longest = Math.max(longest, running);

    let current = 1;
    for (let index = activity.length - 1; index > 0; index -= 1) {
      const date = new Date(`${activity[index]}T00:00:00.000Z`);
      const previous = new Date(`${activity[index - 1]}T00:00:00.000Z`);
      const delta = Math.floor((date.getTime() - previous.getTime()) / 86_400_000);
      if (delta <= 2) {
        current += 1;
      } else {
        break;
      }
    }

    return {
      current,
      longest,
      lastRevisionDate: lastDay,
      graceDaysRemaining,
      history: activity,
    };
  }

  private getSessionForUser(userId: string, sessionId: string): ActiveRecallSessionRecord {
    const session = this.activeRecallSessions.get(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError('Active recall session not found', 404);
    }
    return session;
  }

  private ensureAutoFlashcards(userId: string): void {
    const existingForUser = [...this.flashcards.values()].some((card) => card.userId === userId && card.source === 'auto');
    if (existingForUser) {
      return;
    }

    const topics = this.knowledgeGraphService.listAllTopics();
    topics.slice(0, 25).forEach((topic) => {
      const conceptContent = this.knowledgeGraphService
        .getTopicContent(topic.id)
        .find((content) => content.type === 'concept');
      const body = this.toFlashcardBody(topic.name, conceptContent);
      const now = new Date();
      const card: FlashcardRecord = {
        id: randomUUID(),
        userId,
        topicId: topic.id,
        front: `Key revision prompt: ${topic.name}`,
        back: body,
        source: 'auto',
        createdAt: now,
        lastReviewedAt: null,
        nextReviewAt: now,
        lastRating: null,
      };
      this.flashcards.set(card.id, card);
    });
  }

  private toFlashcardBody(topicName: string, conceptContent: ContentNode | undefined): string {
    if (!conceptContent) {
      return `${topicName}: Revise definition, one example, and one PYQ linkage.`;
    }

    const preview = conceptContent.body.length > 180 ? `${conceptContent.body.slice(0, 180)}...` : conceptContent.body;
    return preview;
  }

  private markActivity(userId: string): void {
    const activity = this.revisionActivityByUser.get(userId) ?? new Set<string>();
    activity.add(dayKey(new Date()));
    this.revisionActivityByUser.set(userId, activity);
  }
}

const defaultRevisionService = new RevisionService();

export const createRevisionService = (options: RevisionServiceOptions = {}): RevisionService => {
  if (Object.keys(options).length === 0) {
    return defaultRevisionService;
  }

  return new RevisionService(options);
};
