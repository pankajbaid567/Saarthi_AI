import { randomUUID } from 'crypto';

import { AppError } from '../errors/app-error.js';
import { createKnowledgeGraphService, type KnowledgeGraphService } from './knowledge-graph.service.js';

type RecallQuality = 1 | 2 | 3 | 4 | 5;
type MicroNoteTier = '30sec' | '2min' | '5min';
type DecayProfile = 'factual' | 'conceptual' | 'analytical';

type RevisionTopicState = {
  id: string;
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
  updatedAt: Date;
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
  recallQuality: RecallQuality;
  retentionBefore: number;
  retentionAfter: number;
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

const dayMs = 24 * 60 * 60 * 1000;

const decayCoefficientByProfile: Record<DecayProfile, number> = {
  factual: 0.9,
  conceptual: 0.7,
  analytical: 0.5,
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const toDaysBetween = (earlier: Date, later: Date): number => {
  return Math.max(0, (later.getTime() - earlier.getTime()) / dayMs);
};

const roundTwo = (value: number): number => Number(value.toFixed(2));

const inferDecayProfile = (subjectName: string): DecayProfile => {
  const normalized = subjectName.toLowerCase();
  if (normalized.includes('history') || normalized.includes('current')) {
    return 'factual';
  }

  if (normalized.includes('ethics') || normalized.includes('philosophy')) {
    return 'analytical';
  }

  return 'conceptual';
};

const getPriority = (retentionScore: number, nextReviewAt: Date, now: Date): 'urgent' | 'due' | 'upcoming' => {
  if (retentionScore < 40) {
    return 'urgent';
  }

  if (nextReviewAt.getTime() <= now.getTime()) {
    return 'due';
  }

  return 'upcoming';
};

const getTierForRetention = (retentionScore: number): MicroNoteTier => {
  if (retentionScore < 40) {
    return '5min';
  }

  if (retentionScore < 70) {
    return '2min';
  }

  return '30sec';
};

const buildMicroNoteFromContent = (content: string, tier: MicroNoteTier): string => {
  const lines = content
    .split('\n')
    .flatMap((line) => line.split('.'))
    .map((line) => line.trim())
    .filter(Boolean);
  const defaultPoints = lines.length > 0 ? lines : ['Revise core concepts', 'Recall important facts', 'Review applied examples'];
  const count = tier === '30sec' ? 4 : tier === '2min' ? 10 : 16;
  const selected = Array.from({ length: Math.min(count, defaultPoints.length) }, (_value, index) => defaultPoints[index]!);
  return selected.map((line) => `• ${line}`).join('\n');
};

export class RevisionService {
  private readonly knowledgeGraphService: KnowledgeGraphService;

  private readonly nowProvider: () => Date;

  private readonly revisionStates = new Map<string, RevisionTopicState>();

  private readonly forgettingCurveData = new Map<string, ForgettingCurveDataPoint[]>();

  private readonly revisionSessionLog: RevisionSessionLog[] = [];

  private readonly microNoteContent = new Map<string, MicroNote>();

  constructor(options: RevisionServiceOptions = {}) {
    this.knowledgeGraphService = options.knowledgeGraphService ?? createKnowledgeGraphService();
    this.nowProvider = options.nowProvider ?? (() => new Date());
  }

  computeRetentionScore(topicId: string, asOf = this.nowProvider(), userId?: string): number {
    const state = this.getOrInitializeTopicState(userId ?? 'system-user', topicId);
    return this.computeRetentionForState(state, asOf);
  }

  predictRetention(topicId: string, targetDate: Date, userId?: string): { topicId: string; date: Date; retentionScore: number } {
    const state = this.getOrInitializeTopicState(userId ?? 'system-user', topicId);
    return {
      topicId,
      date: targetDate,
      retentionScore: this.computeRetentionForState(state, targetDate),
    };
  }

  getDueCards(userId: string, tier?: MicroNoteTier) {
    this.ensureUserBootstrap(userId);
    const now = this.nowProvider();

    return [...this.revisionStates.values()]
      .filter((state) => state.userId === userId)
      .map((state) => this.toRevisionCard(state, now))
      .filter((card) => card.priority !== 'upcoming')
      .filter((card) => (tier ? card.recommendedTier === tier : true))
      .sort((a, b) => {
        const priorityRank: Record<typeof a.priority, number> = { urgent: 0, due: 1, upcoming: 2 };
        return priorityRank[a.priority] - priorityRank[b.priority] || a.nextReviewAt.localeCompare(b.nextReviewAt);
      });
  }

  submitReview(userId: string, topicId: string, recallQuality: RecallQuality) {
    const now = this.nowProvider();
    const state = this.getOrInitializeTopicState(userId, topicId);
    const retentionBefore = this.computeRetentionForState(state, now);
    const difficultyFactor = clamp(1 + (3 - recallQuality) * 0.1, 0.8, 1.2);
    const nextEaseFactor = clamp(
      state.easeFactor + (0.1 - (5 - recallQuality) * (0.08 + (5 - recallQuality) * 0.02)),
      1.3,
      2.5,
    );

    let nextIntervalDays = 1;
    if (recallQuality >= 3) {
      const decayCoefficient = decayCoefficientByProfile[state.decayProfile];
      nextIntervalDays = Math.max(
        1,
        Math.round(state.intervalDays * nextEaseFactor * decayCoefficient * difficultyFactor + recallQuality - 2),
      );
    }

    state.reviewCount += 1;
    state.easeFactor = nextEaseFactor;
    state.intervalDays = nextIntervalDays;
    state.lastReviewedAt = now;
    state.nextReviewAt = new Date(now.getTime() + nextIntervalDays * dayMs);
    state.retentionScore = this.computeRetentionForState(state, now);
    state.updatedAt = now;

    const retentionAfter = state.retentionScore;
    this.appendCurvePoint(userId, topicId, now, retentionAfter);
    this.revisionSessionLog.push({
      id: randomUUID(),
      userId,
      topicId,
      recallQuality,
      retentionBefore,
      retentionAfter,
      createdAt: now,
    });

    return {
      topicId,
      recallQuality,
      retentionBefore,
      retentionAfter,
      nextReviewAt: state.nextReviewAt,
      intervalDays: state.intervalDays,
      easeFactor: state.easeFactor,
    };
  }

  getDashboard(userId: string) {
    this.ensureUserBootstrap(userId);
    const now = this.nowProvider();
    const cards = [...this.revisionStates.values()]
      .filter((state) => state.userId === userId)
      .map((state) => this.toRevisionCard(state, now));
    const urgentCount = cards.filter((card) => card.priority === 'urgent').length;
    const dueCount = cards.filter((card) => card.priority !== 'upcoming').length;
    const averageRetention =
      cards.length === 0 ? 0 : roundTwo(cards.reduce((sum, card) => sum + card.retentionScore, 0) / cards.length);

    return {
      dueCount,
      urgentCount,
      averageRetention,
      streakDays: this.calculateStreak(userId),
      retentionHeatmap: cards.map((card) => ({
        topicId: card.topicId,
        subjectId: card.subjectId,
        retentionScore: card.retentionScore,
      })),
    };
  }

  getForgettingCurve(userId: string, topicId: string) {
    this.getOrInitializeTopicState(userId, topicId);
    return {
      topicId,
      points: [...(this.forgettingCurveData.get(`${userId}:${topicId}`) ?? [])].sort(
        (a, b) => a.date.getTime() - b.date.getTime(),
      ),
    };
  }

  getBulkForgettingCurves(userId: string, subjectId?: string) {
    this.ensureUserBootstrap(userId);
    const states = [...this.revisionStates.values()].filter(
      (state) => state.userId === userId && (subjectId ? state.subjectId === subjectId : true),
    );

    return states.map((state) => this.getForgettingCurve(userId, state.topicId));
  }

  getRetentionScores(userId: string) {
    this.ensureUserBootstrap(userId);
    const now = this.nowProvider();
    return [...this.revisionStates.values()]
      .filter((state) => state.userId === userId)
      .map((state) => this.toRevisionCard(state, now))
      .sort((a, b) => a.retentionScore - b.retentionScore);
  }

  getMicroNotes(userId: string, topicId: string) {
    this.getOrInitializeTopicState(userId, topicId);
    const notes = [...this.microNoteContent.values()].filter((note) => note.userId === userId && note.topicId === topicId);
    const requiredTiers: MicroNoteTier[] = ['30sec', '2min', '5min'];
    return requiredTiers.map((tier) => notes.find((note) => note.tier === tier)).filter(Boolean);
  }

  generateMicroNotes(userId: string, topicId: string, sourceContent?: string) {
    const topic = this.knowledgeGraphService.getTopic(topicId);
    const fallbackContent = this.knowledgeGraphService
      .getTopicContent(topicId)
      .map((content) => content.body)
      .join('\n');
    const content = sourceContent?.trim() || fallbackContent || `Revision summary for ${topic.name}`;
    const now = this.nowProvider();

    const generatedNotes: MicroNote[] = (['30sec', '2min', '5min'] as const).map((tier) => {
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
    return {
      topicId,
      subjectId: topic.subjectId,
      notes: generatedNotes,
    };
  }

  updateMicroNote(userId: string, noteId: string, input: { tier?: MicroNoteTier; content?: string }) {
    const existing = this.microNoteContent.get(noteId);
    if (!existing || existing.userId !== userId) {
      throw new AppError('Micro-note not found', 404);
    }

    const updated: MicroNote = {
      ...existing,
      tier: input.tier ?? existing.tier,
      content: input.content ?? existing.content,
      updatedAt: this.nowProvider(),
    };
    this.microNoteContent.set(noteId, updated);
    return updated;
  }

  private toRevisionCard(state: RevisionTopicState, now: Date) {
    const retentionScore = this.computeRetentionForState(state, now);
    state.retentionScore = retentionScore;
    const priority = getPriority(retentionScore, state.nextReviewAt, now);
    return {
      topicId: state.topicId,
      subjectId: state.subjectId,
      retentionScore,
      nextReviewAt: state.nextReviewAt.toISOString(),
      priority,
      recommendedTier: getTierForRetention(retentionScore),
      intervalDays: state.intervalDays,
      easeFactor: roundTwo(state.easeFactor),
    };
  }

  private appendCurvePoint(userId: string, topicId: string, date: Date, retentionScore: number): void {
    const key = `${userId}:${topicId}`;
    const existing = this.forgettingCurveData.get(key) ?? [];
    existing.push({
      topicId,
      date,
      retentionScore,
    });
    this.forgettingCurveData.set(key, existing);
  }

  private ensureUserBootstrap(userId: string): void {
    const topics = this.knowledgeGraphService.listAllTopics();
    topics.forEach((topic) => {
      this.getOrInitializeTopicState(userId, topic.id);
    });
  }

  private getOrInitializeTopicState(userId: string, topicId: string): RevisionTopicState {
    const key = `${userId}:${topicId}`;
    const existing = this.revisionStates.get(key);
    if (existing) {
      return existing;
    }

    const topic = this.knowledgeGraphService.getTopic(topicId);
    const subject = this.knowledgeGraphService.getSubject(topic.subjectId);
    const now = this.nowProvider();

    const state: RevisionTopicState = {
      id: randomUUID(),
      userId,
      topicId,
      subjectId: topic.subjectId,
      decayProfile: inferDecayProfile(subject.name),
      reviewCount: 0,
      easeFactor: 2.5,
      intervalDays: 1,
      retentionScore: 100,
      lastReviewedAt: now,
      nextReviewAt: new Date(now.getTime() + dayMs),
      updatedAt: now,
    };

    this.revisionStates.set(key, state);
    this.appendCurvePoint(userId, topicId, now, 100);
    return state;
  }

  private computeRetentionForState(state: RevisionTopicState, asOf: Date): number {
    const elapsedDays = toDaysBetween(state.lastReviewedAt, asOf);
    const decayCoefficient = decayCoefficientByProfile[state.decayProfile];
    const stability = Math.max(1, state.intervalDays * decayCoefficient * state.easeFactor);
    return roundTwo(clamp(100 * Math.exp(-elapsedDays / stability), 0, 100));
  }

  private calculateStreak(userId: string): number {
    const sessions = this.revisionSessionLog
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (sessions.length === 0) {
      return 0;
    }

    const days = new Set(sessions.map((entry) => entry.createdAt.toISOString().slice(0, 10)));
    return days.size;
  }
}

const defaultRevisionService = new RevisionService();

export const createRevisionService = (options: RevisionServiceOptions = {}): RevisionService => {
  if (Object.keys(options).length === 0) {
    return defaultRevisionService;
  }

  return new RevisionService(options);
};
