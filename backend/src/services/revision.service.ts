import { randomUUID } from 'crypto';

import { AppError } from '../errors/app-error.js';
import type { ContentNode, KnowledgeGraphService } from './knowledge-graph.service.js';
import { createKnowledgeGraphService } from './knowledge-graph.service.js';

type RecallQuestionType = 'concept_recall' | 'comparison' | 'factual' | 'application';
type FlashcardRating = 'easy' | 'good' | 'hard' | 'forgot';
type TopicPriority = 'urgent' | 'due' | 'upcoming';
type RecallQuality = 1 | 2 | 3 | 4 | 5;
type MicroNoteTier = '30sec' | '2min' | '5min';
type DecayProfile = 'factual' | 'conceptual' | 'analytical';

type ActiveRecallQuestionRecord = {
  id: string;
  sessionId: string;
  userId: string;
  topicId: string;
  type: RecallQuestionType;
  questionText: string;
  expectedAnswer: string;
};

type ActiveRecallAnswerRecord = {
  questionId: string;
  userAnswer: string;
  confidenceLevel: number | null;
  score: number;
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

type RevisionTopicState = {
  userId: string;
  topicId: string;
  subjectId: string;
  decayProfile: DecayProfile;
  reviewCount: number;
  easeFactor: number;
  intervalDays: number;
  retentionScore: number;
  lastReviewedAt: Date;
  nextReviewAt: Date;
};

type ForgettingCurveDataPoint = {
  topicId: string;
  date: Date;
  retentionScore: number;
};

type RevisionSessionLog = {
  id: string;
  userId: string;
  topicId: string;
  createdAt: Date;
};

type MicroNote = {
  id: string;
  userId: string;
  topicId: string;
  tier: MicroNoteTier;
  content: string;
  updatedAt: Date;
  createdAt: Date;
};

type RevisionServiceOptions = {
  knowledgeGraphService?: KnowledgeGraphService;
  nowProvider?: () => Date;
};

const recallTypes: RecallQuestionType[] = ['concept_recall', 'comparison', 'factual', 'application'];
const dayMs = 24 * 60 * 60 * 1000;
const streakGraceDays = 1;

const decayCoefficientByProfile: Record<DecayProfile, number> = {
  factual: 0.9,
  conceptual: 0.7,
  analytical: 0.5,
};

const addDays = (value: Date, days: number): Date => {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const dayKey = (value: Date): string => value.toISOString().slice(0, 10);

const inferDecayProfile = (subjectName: string): DecayProfile => {
  const normalized = subjectName.toLowerCase();
  if (normalized.includes('history') || normalized.includes('current')) return 'factual';
  if (normalized.includes('ethics') || normalized.includes('philosophy')) return 'analytical';
  return 'conceptual';
};

const defaultExpectedAnswer = (topicName: string, type: RecallQuestionType): string => {
  switch (type) {
    case 'comparison':
      return `Compare ${topicName} and provide one key differentiator with an example.`;
    case 'factual':
      return `State two to three key facts about ${topicName}.`;
    case 'application':
      return `Apply ${topicName} in one governance or policy scenario.`;
    default:
      return `Define ${topicName} and explain why it matters.`;
  }
};

const toQuestionText = (topicName: string, type: RecallQuestionType): string => {
  switch (type) {
    case 'comparison':
      return `Compare ${topicName} with a closely related concept.`;
    case 'factual':
      return `List high-yield facts for ${topicName}.`;
    case 'application':
      return `How would you apply ${topicName} in a current affairs context?`;
    default:
      return `Explain ${topicName} in your own words.`;
  }
};

const scoreAnswer = (userAnswer: string, expectedAnswer: string, confidenceLevel: number | null): number => {
  const answer = userAnswer.trim().toLowerCase();
  if (!answer) return 0;
  const answerWords = new Set(
    answer
      .split(/\W+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 3),
  );
  const expectedWords = expectedAnswer
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length >= 5);
  const overlap = expectedWords.filter((word) => answerWords.has(word)).length;
  const lexicalScore = expectedWords.length === 0 ? 50 : Math.round((overlap / expectedWords.length) * 100);
  const confidenceBoost = confidenceLevel === null ? 0 : (confidenceLevel - 3) * 4;
  return clamp(lexicalScore + confidenceBoost, 0, 100);
};

const buildMicroNoteFromContent = (content: string, tier: MicroNoteTier): string => {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const count = tier === '30sec' ? 4 : tier === '2min' ? 10 : 16;
  const picked = lines.slice(0, count);
  return (picked.length > 0 ? picked : ['Revise concepts', 'Recall facts']).map((line) => `• ${line}`).join('\n');
};

export class RevisionService {
  private readonly knowledgeGraphService: KnowledgeGraphService;
  private readonly nowProvider: () => Date;

  private readonly activeRecallQuestions = new Map<string, ActiveRecallQuestionRecord>();
  private readonly activeRecallSessions = new Map<string, ActiveRecallSessionRecord>();
  private readonly activeRecallAnswers = new Map<string, ActiveRecallAnswerRecord>();
  private readonly sprintSessions = new Map<string, SprintRecord>();
  private readonly flashcards = new Map<string, FlashcardRecord>();
  private readonly revisionActivityByUser = new Map<string, Set<string>>();

  private readonly revisionStates = new Map<string, RevisionTopicState>();
  private readonly forgettingCurveData = new Map<string, ForgettingCurveDataPoint[]>();
  private readonly revisionSessionLog: RevisionSessionLog[] = [];
  private readonly microNoteContent = new Map<string, MicroNote>();

  constructor(options: RevisionServiceOptions = {}) {
    this.knowledgeGraphService = options.knowledgeGraphService ?? createKnowledgeGraphService();
    this.nowProvider = options.nowProvider ?? (() => new Date());
  }

  startActiveRecallSession(userId: string, input: { topicIds: string[]; questionCount: number; types?: RecallQuestionType[] }) {
    const requestedTypes = input.types?.length ? input.types : recallTypes;
    const topics = input.topicIds.map((topicId) => this.knowledgeGraphService.getTopic(topicId));
    const sessionId = randomUUID();

    const questions: ActiveRecallQuestionRecord[] = Array.from({ length: input.questionCount }).map((_, index) => {
      const topic = topics[index % topics.length]!;
      const type = requestedTypes[index % requestedTypes.length]!;
      const question: ActiveRecallQuestionRecord = {
        id: randomUUID(),
        sessionId,
        userId,
        topicId: topic.id,
        type,
        questionText: toQuestionText(topic.name, type),
        expectedAnswer: defaultExpectedAnswer(topic.name, type),
      };
      this.activeRecallQuestions.set(question.id, question);
      return question;
    });

    this.activeRecallSessions.set(sessionId, {
      id: sessionId,
      userId,
      topicIds: input.topicIds,
      questionIds: questions.map((question) => question.id),
      startedAt: this.nowProvider(),
      completedAt: null,
    });
    this.markActivity(userId);

    return { sessionId, questions, totalQuestions: questions.length };
  }

  submitActiveRecallAnswer(userId: string, sessionId: string, input: { questionId: string; userAnswer: string; confidenceLevel?: number }) {
    const session = this.getSessionForUser(userId, sessionId);
    if (!session.questionIds.includes(input.questionId)) throw new AppError('Question does not belong to session', 400);
    const question = this.activeRecallQuestions.get(input.questionId);
    if (!question) throw new AppError('Question not found', 404);

    const confidenceLevel = input.confidenceLevel ?? null;
    const score = scoreAnswer(input.userAnswer, question.expectedAnswer, confidenceLevel);
    this.activeRecallAnswers.set(`${sessionId}:${input.questionId}`, {
      questionId: input.questionId,
      userAnswer: input.userAnswer,
      confidenceLevel,
      score,
    });
    this.markActivity(userId);

    return { questionId: input.questionId, score };
  }

  getActiveRecallResults(userId: string, sessionId: string) {
    const session = this.getSessionForUser(userId, sessionId);
    const results = session.questionIds.map((questionId) => {
      const question = this.activeRecallQuestions.get(questionId);
      if (!question) throw new AppError('Question not found', 404);
      const answer = this.activeRecallAnswers.get(`${sessionId}:${questionId}`) ?? null;
      return {
        questionId,
        type: question.type,
        topicId: question.topicId,
        score: answer?.score ?? null,
        confidenceLevel: answer?.confidenceLevel ?? null,
      };
    });

    const scores = results.map((result) => result.score).filter((score): score is number => score !== null);
    const averageScore = scores.length ? Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2)) : 0;

    if (scores.length === results.length && session.completedAt === null) {
      session.completedAt = this.nowProvider();
      this.activeRecallSessions.set(sessionId, session);
    }

    return {
      sessionId,
      totalQuestions: session.questionIds.length,
      answeredQuestions: scores.length,
      averageScore,
      recallDelta: Number((averageScore - 45).toFixed(2)),
      results,
    };
  }

  startSprint(userId: string, input: { durationMinutes: 15 | 30 | 45; subjectId?: string; crashMode?: boolean; daysRemaining?: number }) {
    const topicLimit = input.durationMinutes === 15 ? 4 : input.durationMinutes === 30 ? 8 : 12;
    const topics = this.knowledgeGraphService
      .listAllTopics()
      .filter((topic) => !input.subjectId || topic.subjectId === input.subjectId)
      .slice(0, topicLimit);

    if (topics.length === 0) throw new AppError('No topics available for sprint', 400);

    const sprintId = randomUUID();
    const crashMode = Boolean(input.crashMode);
    const daysRemaining = crashMode ? (input.daysRemaining ?? 30) : null;

    this.sprintSessions.set(sprintId, {
      id: sprintId,
      userId,
      durationMinutes: input.durationMinutes,
      crashMode,
      daysRemaining,
      topicIds: topics.map((topic) => topic.id),
      startedAt: this.nowProvider(),
      completedAt: null,
      notes: null,
    });
    this.markActivity(userId);

    return {
      sprintId,
      durationMinutes: input.durationMinutes,
      crashMode,
      acceleratedScheduling: crashMode,
      dailyTargetTopics: crashMode ? Math.max(1, Math.ceil(topics.length / (daysRemaining ?? 30))) : null,
      topics: topics.map((topic) => ({
        topicId: topic.id,
        topicName: topic.name,
        priority: 'due' as TopicPriority,
        retentionScore: this.computeRetentionScore(topic.id, this.nowProvider(), userId),
        microNoteTier: '2min' as MicroNoteTier,
      })),
      totalTopics: topics.length,
      startedAt: this.nowProvider(),
    };
  }

  completeSprint(userId: string, sprintId: string, input?: { completedTopicIds?: string[]; notes?: string }) {
    const sprint = this.sprintSessions.get(sprintId);
    if (!sprint || sprint.userId !== userId) throw new AppError('Sprint not found', 404);

    const completedTopicIds = input?.completedTopicIds?.filter((topicId) => sprint.topicIds.includes(topicId)) ?? sprint.topicIds;
    const completedTopics = completedTopicIds.length;
    const totalTopics = sprint.topicIds.length;

    sprint.completedAt = this.nowProvider();
    sprint.notes = input?.notes ?? null;
    this.sprintSessions.set(sprintId, sprint);
    this.markActivity(userId);

    return {
      sprintId,
      completedTopics,
      totalTopics,
      completionRate: totalTopics === 0 ? 0 : Number(((completedTopics / totalTopics) * 100).toFixed(2)),
      summary: 'Sprint completed',
      completedAt: sprint.completedAt,
    };
  }

  listSprintHistory(userId: string) {
    return [...this.sprintSessions.values()]
      .filter((session) => session.userId === userId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .map((session) => ({
        sprintId: session.id,
        durationMinutes: session.durationMinutes,
        crashMode: session.crashMode,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        totalTopics: session.topicIds.length,
      }));
  }

  listFlashcards(userId: string, query: { topicId?: string; subjectId?: string; due?: boolean; limit?: number }) {
    this.ensureAutoFlashcards(userId);
    const now = this.nowProvider();
    const topicIdsForSubject = new Set(
      this.knowledgeGraphService
        .listAllTopics()
        .filter((topic) => !query.subjectId || topic.subjectId === query.subjectId)
        .map((topic) => topic.id),
    );

    return [...this.flashcards.values()]
      .filter((card) => card.userId === userId)
      .filter((card) => !query.topicId || card.topicId === query.topicId)
      .filter((card) => (query.subjectId ? topicIdsForSubject.has(card.topicId) : true))
      .filter((card) => (query.due ? card.nextReviewAt.getTime() <= now.getTime() : true))
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
    const now = this.nowProvider();
    const card: FlashcardRecord = {
      id: randomUUID(),
      userId,
      topicId: input.topicId,
      front: input.front,
      back: input.back,
      source: 'manual',
      createdAt: now,
      lastReviewedAt: null,
      nextReviewAt: addDays(now, 3),
      lastRating: null,
    };
    this.flashcards.set(card.id, card);
    this.markActivity(userId);
    return card;
  }

  getPredictions(userId: string) {
    const predictedToForget = this.knowledgeGraphService.listAllTopics().map((topic) => {
      const currentRetention = this.computeRetentionScore(topic.id, this.nowProvider(), userId);
      const predictedRetentionIn7Days = Math.max(0, Math.round(currentRetention - 12));
      return {
        topicId: topic.id,
        topicName: topic.name,
        currentRetention,
        predictedRetentionIn7Days,
        decayRate: 0.6,
        recommendation: predictedRetentionIn7Days < 35 ? 'Review in next 24-48 hours.' : 'Review this week.',
        alert: (predictedRetentionIn7Days < 35 ? 'high' : 'moderate') as 'high' | 'moderate',
      };
    });

    this.markActivity(userId);
    return {
      predictedToForget,
      alerts: predictedToForget.map((entry) => ({
        topicId: entry.topicId,
        topicName: entry.topicName,
        severity: entry.alert,
        message: entry.alert === 'high' ? 'Retention is rapidly declining.' : 'Retention is declining.',
      })),
    };
  }

  getStreaks(userId: string) {
    const history = [...(this.revisionActivityByUser.get(userId) ?? new Set<string>())].sort();
    if (history.length === 0) {
      return { current: 0, longest: 0, lastRevisionDate: null, graceDaysRemaining: 1, history: [] as string[] };
    }

    let longest = 1;
    let running = 1;
    for (let i = 1; i < history.length; i += 1) {
      const delta =
        (new Date(`${history[i]}T00:00:00.000Z`).getTime() - new Date(`${history[i - 1]}T00:00:00.000Z`).getTime()) / dayMs;
      if (delta <= streakGraceDays + 1) running += 1;
      else {
        longest = Math.max(longest, running);
        running = 1;
      }
    }
    longest = Math.max(longest, running);

    let current = 1;
    for (let i = history.length - 1; i > 0; i -= 1) {
      const delta =
        (new Date(`${history[i]}T00:00:00.000Z`).getTime() - new Date(`${history[i - 1]}T00:00:00.000Z`).getTime()) / dayMs;
      if (delta <= streakGraceDays + 1) current += 1;
      else break;
    }

    return {
      current,
      longest,
      lastRevisionDate: history.at(-1) ?? null,
      graceDaysRemaining: 1,
      history,
    };
  }

  computeRetentionScore(topicId: string, asOf = this.nowProvider(), userId = 'system-user'): number {
    const state = this.getOrInitializeTopicState(userId, topicId);
    const elapsedDays = Math.max(0, (asOf.getTime() - state.lastReviewedAt.getTime()) / dayMs);
    const coefficient = decayCoefficientByProfile[state.decayProfile];
    const stability = Math.max(1, state.intervalDays * coefficient * state.easeFactor);
    return Number(clamp(100 * Math.exp(-elapsedDays / stability), 0, 100).toFixed(2));
  }

  predictRetention(topicId: string, targetDate: Date, userId = 'system-user') {
    return { topicId, date: targetDate, retentionScore: this.computeRetentionScore(topicId, targetDate, userId) };
  }

  getDueCards(userId: string, tier?: MicroNoteTier) {
    this.ensureUserBootstrap(userId);
    const now = this.nowProvider();
    return [...this.revisionStates.values()]
      .filter((state) => state.userId === userId)
      .map((state) => {
        const retentionScore = this.computeRetentionScore(state.topicId, now, userId);
        const priority: TopicPriority = retentionScore < 40 ? 'urgent' : state.nextReviewAt <= now ? 'due' : 'upcoming';
        const recommendedTier: MicroNoteTier = retentionScore < 40 ? '5min' : retentionScore < 70 ? '2min' : '30sec';
        return {
          topicId: state.topicId,
          subjectId: state.subjectId,
          retentionScore,
          nextReviewAt: state.nextReviewAt.toISOString(),
          priority,
          recommendedTier,
          intervalDays: state.intervalDays,
          easeFactor: Number(state.easeFactor.toFixed(2)),
        };
      })
      .filter((card) => card.priority !== 'upcoming')
      .filter((card) => (tier ? card.recommendedTier === tier : true));
  }

  submitReview(userId: string, topicId: string, recallQuality: RecallQuality) {
    const state = this.getOrInitializeTopicState(userId, topicId);
    const now = this.nowProvider();
    const retentionBefore = this.computeRetentionScore(topicId, now, userId);

    state.reviewCount += 1;
    state.easeFactor = clamp(state.easeFactor + (recallQuality >= 4 ? 0.1 : -0.2), 1.3, 2.5);
    state.intervalDays = recallQuality >= 3 ? Math.max(1, Math.round(state.intervalDays * state.easeFactor * 0.7)) : 1;
    state.lastReviewedAt = now;
    state.nextReviewAt = addDays(now, state.intervalDays);
    state.retentionScore = this.computeRetentionScore(topicId, now, userId);

    this.appendCurvePoint(userId, topicId, now, state.retentionScore);
    this.revisionSessionLog.push({ id: randomUUID(), userId, topicId, createdAt: now });
    this.markActivity(userId);

    return {
      topicId,
      recallQuality,
      retentionBefore,
      retentionAfter: state.retentionScore,
      nextReviewAt: state.nextReviewAt,
      intervalDays: state.intervalDays,
      easeFactor: state.easeFactor,
    };
  }

  getDashboard(userId: string) {
    const cards = this.getDueCards(userId);
    return {
      dueCount: cards.length,
      urgentCount: cards.filter((card) => card.priority === 'urgent').length,
      averageRetention: cards.length ? Number((cards.reduce((sum, card) => sum + card.retentionScore, 0) / cards.length).toFixed(2)) : 0,
      streakDays: this.calculateStreak(userId),
      retentionHeatmap: cards.map((card) => ({ topicId: card.topicId, subjectId: card.subjectId, retentionScore: card.retentionScore })),
    };
  }

  getForgettingCurve(userId: string, topicId: string) {
    this.getOrInitializeTopicState(userId, topicId);
    return { topicId, points: [...(this.forgettingCurveData.get(`${userId}:${topicId}`) ?? [])] };
  }

  getBulkForgettingCurves(userId: string, subjectId?: string) {
    this.ensureUserBootstrap(userId);
    return [...this.revisionStates.values()]
      .filter((state) => state.userId === userId && (subjectId ? state.subjectId === subjectId : true))
      .map((state) => this.getForgettingCurve(userId, state.topicId));
  }

  getRetentionScores(userId: string) {
    this.ensureUserBootstrap(userId);
    return [...this.revisionStates.values()]
      .filter((state) => state.userId === userId)
      .map((state) => ({
        topicId: state.topicId,
        subjectId: state.subjectId,
        retentionScore: this.computeRetentionScore(state.topicId, this.nowProvider(), userId),
        nextReviewAt: state.nextReviewAt.toISOString(),
      }));
  }

  getMicroNotes(userId: string, topicId: string) {
    this.getOrInitializeTopicState(userId, topicId);
    const notes = [...this.microNoteContent.values()].filter((note) => note.userId === userId && note.topicId === topicId);
    const tiers: MicroNoteTier[] = ['30sec', '2min', '5min'];
    return tiers.map((tier) => notes.find((note) => note.tier === tier)).filter(Boolean);
  }

  generateMicroNotes(userId: string, topicId: string, sourceContent?: string) {
    const topic = this.knowledgeGraphService.getTopic(topicId);
    const content =
      sourceContent?.trim() ||
      this.knowledgeGraphService
        .getTopicContent(topicId)
        .map((item) => item.body)
        .join('\n') ||
      `Revision summary for ${topic.name}`;

    const now = this.nowProvider();
    const notes: MicroNote[] = (['30sec', '2min', '5min'] as const).map((tier) => {
      const existing = [...this.microNoteContent.values()].find(
        (note) => note.userId === userId && note.topicId === topicId && note.tier === tier,
      );

      const note: MicroNote = {
        id: existing?.id ?? randomUUID(),
        userId,
        topicId,
        tier,
        content: buildMicroNoteFromContent(content, tier),
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      this.microNoteContent.set(note.id, note);
      return note;
    });

    this.getOrInitializeTopicState(userId, topicId);
    return { topicId, subjectId: topic.subjectId, notes };
  }

  updateMicroNote(userId: string, noteId: string, input: { tier?: MicroNoteTier; content?: string }) {
    const existing = this.microNoteContent.get(noteId);
    if (!existing || existing.userId !== userId) throw new AppError('Micro-note not found', 404);

    const updated: MicroNote = {
      ...existing,
      tier: input.tier ?? existing.tier,
      content: input.content ?? existing.content,
      updatedAt: this.nowProvider(),
    };

    this.microNoteContent.set(noteId, updated);
    return updated;
  }

  private getSessionForUser(userId: string, sessionId: string): ActiveRecallSessionRecord {
    const session = this.activeRecallSessions.get(sessionId);
    if (!session || session.userId !== userId) throw new AppError('Active recall session not found', 404);
    return session;
  }

  private ensureAutoFlashcards(userId: string): void {
    const alreadyCreated = [...this.flashcards.values()].some((card) => card.userId === userId && card.source === 'auto');
    if (alreadyCreated) return;

    this.knowledgeGraphService.listAllTopics().slice(0, 25).forEach((topic) => {
      const content = this.knowledgeGraphService.getTopicContent(topic.id).find((item) => item.type === 'concept');
      const card: FlashcardRecord = {
        id: randomUUID(),
        userId,
        topicId: topic.id,
        front: `Key revision prompt: ${topic.name}`,
        back: this.toFlashcardBody(topic.name, content),
        source: 'auto',
        createdAt: this.nowProvider(),
        lastReviewedAt: null,
        nextReviewAt: this.nowProvider(),
        lastRating: null,
      };
      this.flashcards.set(card.id, card);
    });
  }

  private toFlashcardBody(topicName: string, conceptContent: ContentNode | undefined): string {
    if (!conceptContent) return `${topicName}: revise definition, one example, and one policy linkage.`;
    return conceptContent.body.length > 180 ? `${conceptContent.body.slice(0, 180)}...` : conceptContent.body;
  }

  private markActivity(userId: string): void {
    const activity = this.revisionActivityByUser.get(userId) ?? new Set<string>();
    activity.add(dayKey(this.nowProvider()));
    this.revisionActivityByUser.set(userId, activity);
  }

  private ensureUserBootstrap(userId: string): void {
    this.knowledgeGraphService.listAllTopics().forEach((topic) => {
      this.getOrInitializeTopicState(userId, topic.id);
    });
  }

  private getOrInitializeTopicState(userId: string, topicId: string): RevisionTopicState {
    const key = `${userId}:${topicId}`;
    const existing = this.revisionStates.get(key);
    if (existing) return existing;

    const topic = this.knowledgeGraphService.getTopic(topicId);
    const subject = this.knowledgeGraphService.getSubject(topic.subjectId);
    const now = this.nowProvider();

    const state: RevisionTopicState = {
      userId,
      topicId,
      subjectId: topic.subjectId,
      decayProfile: inferDecayProfile(subject.name),
      reviewCount: 0,
      easeFactor: 2.5,
      intervalDays: 1,
      retentionScore: 100,
      lastReviewedAt: now,
      nextReviewAt: addDays(now, 1),
    };

    this.revisionStates.set(key, state);
    this.appendCurvePoint(userId, topicId, now, 100);
    return state;
  }

  private appendCurvePoint(userId: string, topicId: string, date: Date, retentionScore: number): void {
    const key = `${userId}:${topicId}`;
    const points = this.forgettingCurveData.get(key) ?? [];
    points.push({ topicId, date, retentionScore });
    this.forgettingCurveData.set(key, points);
  }

  private calculateStreak(userId: string): number {
    const uniqueDays = new Set(this.revisionSessionLog.filter((entry) => entry.userId === userId).map((entry) => dayKey(entry.createdAt)));
    return uniqueDays.size;
  }
}

const defaultRevisionService = new RevisionService();

export const createRevisionService = (options: RevisionServiceOptions = {}): RevisionService => {
  if (Object.keys(options).length === 0) return defaultRevisionService;
  return new RevisionService(options);
};
