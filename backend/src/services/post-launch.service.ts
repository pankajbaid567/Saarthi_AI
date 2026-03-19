import { randomUUID } from 'crypto';

import { AppError } from '../errors/app-error.js';

type ForumMessage = {
  id: string;
  topicId: string;
  userId: string;
  message: string;
  createdAt: string;
};

type CommunityState = {
  forumMessages: ForumMessage[];
};

const toIsoDate = (value: Date): string => value.toISOString().slice(0, 10);

export class PostLaunchService {
  private readonly communityByUser = new Map<string, CommunityState>();

  getCommunity(userId: string) {
    const state = this.ensureCommunityState(userId);
    const today = new Date();
    return {
      forumsByTopic: [
        { topicId: 'polity-federalism', topicName: 'Polity: Federalism', threads: 8, activeUsers: 34 },
        { topicId: 'economy-inflation', topicName: 'Economy: Inflation', threads: 5, activeUsers: 22 },
      ],
      recentMessages: state.forumMessages.slice(-5).reverse(),
      peerAnswerReview: { pendingReviews: 3, reviewedThisWeek: 7, avgScoreDelta: 11.5 },
      studyGroups: [
        { id: 'group-1', name: 'Prelims 2027 Momentum', members: 42, schedule: 'Mon/Wed/Fri 8 PM' },
        { id: 'group-2', name: 'Mains Ethics Circle', members: 19, schedule: 'Tue/Thu 9 PM' },
      ],
      leaderboards: {
        revisionStreak: [
          { userId: 'u-101', displayName: 'Aspirant_101', streakDays: 64 },
          { userId: 'u-102', displayName: 'Aspirant_102', streakDays: 52 },
        ],
        practiceStreak: [
          { userId: 'u-201', displayName: 'Aspirant_201', streakDays: 31 },
          { userId: 'u-202', displayName: 'Aspirant_202', streakDays: 29 },
        ],
        syllabusCompletion: [
          { userId: 'u-301', displayName: 'Aspirant_301', completionPercent: 78 },
          { userId: 'u-302', displayName: 'Aspirant_302', completionPercent: 74 },
        ],
      },
      refreshedAt: today.toISOString(),
    };
  }

  addForumMessage(userId: string, topicId: string, message: string) {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      throw new AppError('Forum message is required', 400);
    }

    const entry: ForumMessage = {
      id: randomUUID(),
      topicId,
      userId,
      message: trimmedMessage,
      createdAt: new Date().toISOString(),
    };

    const state = this.ensureCommunityState(userId);
    state.forumMessages.push(entry);
    return entry;
  }

  getAdvancedAi(userId: string) {
    const profileHash = userId.length % 3;
    return {
      modes: [
        { id: 'upsc-thinking', name: 'UPSC Thinking Mode', focus: 'Elimination logic like toppers' },
        { id: 'topper-brain', name: 'Topper Brain Simulation', focus: 'AIR < 50 style reasoning' },
        { id: 'socratic', name: 'Socratic Questioning', focus: 'Guided discovery with counter-questions' },
      ],
      voiceQuiz: { enabled: true, engine: 'speech-to-text', languageSupport: ['en-IN', 'hi-IN'] },
      neuroReviseGroupPatterns: {
        strongestForgettingWindowHours: profileHash === 0 ? 36 : 48,
        recommendedGroupRevisionSlot: profileHash === 2 ? '21:00-21:30' : '20:30-21:00',
      },
      syllabusFlowPeerCalibration: {
        suggestedDifficulty: profileHash === 1 ? 'medium' : 'hard',
        peerPercentile: profileHash === 1 ? 62 : 74,
      },
    };
  }

  analyzeError(input: { questionId: string; userAnswer: string; correctAnswer: string; topicId?: string }) {
    if (!input.questionId || !input.userAnswer || !input.correctAnswer) {
      throw new AppError('questionId, userAnswer and correctAnswer are required', 400);
    }

    const normalizedUserAnswer = input.userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = input.correctAnswer.trim().toLowerCase();
    const answeredCorrectly = normalizedUserAnswer === normalizedCorrectAnswer;
    const conceptGap = answeredCorrectly ? 'low' : 'high';
    return {
      questionId: input.questionId,
      conceptGap,
      whyYouGotThisWrong:
        answeredCorrectly
          ? 'Your final answer was correct, but reasoning confidence was inconsistent.'
          : 'You selected an option that matched a familiar keyword but missed the core qualifier in the stem.',
      neuroReviseContext: {
        topicId: input.topicId ?? 'general',
        lastRevisionMissProbability: answeredCorrectly ? 0.24 : 0.62,
        nextBestAction: answeredCorrectly ? 'Flashcard reinforcement in 72 hours' : 'Active recall in 24 hours',
      },
    };
  }

  getContentExpansion() {
    return {
      optionalSubjectModules: ['Public Administration', 'Geography', 'Sociology'],
      interviewPreparation: { enabled: true, mockPanels: 12, stressQuestionsBank: 80 },
      statePcsSupport: ['UPPCS', 'BPSC', 'MPPSC', 'RAS'],
      multiLanguageMicroNotes: {
        supportedLanguages: ['English', 'Hindi'],
        translatedNotesCount: 240,
      },
    };
  }

  getMobileCompanion() {
    return {
      platform: 'React Native',
      offlineMode: {
        cachedAssets: ['micro-notes', 'flashcards', 'daily-practice'],
        maxOfflineDays: 14,
      },
      pushNotifications: ['revision-due', 'practice-ready', 'streak-at-risk'],
      widget: { enabled: true, metrics: ['daily-revision-progress', 'daily-practice-progress'] },
    };
  }

  getAdvancedAnalytics() {
    const today = new Date();
    const trend = Array.from({ length: 6 }, (_, index) => {
      const month = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (5 - index), 1));
      return {
        month: month.toISOString().slice(0, 7),
        retentionPercent: 61 + index * 4,
      };
    });

    return {
      comparativeAnalysis: {
        topperBaselineScore: 72,
        currentUserScore: 64,
        gapAreas: ['Answer structuring', 'Revision consistency'],
      },
      customReportGeneration: { formats: ['pdf', 'json'], latestGeneratedAt: today.toISOString() },
      parentMentorDashboard: { enabled: true, sharableDigest: true, weeklyDigestDay: 'Sunday' },
      studyPatternOptimization: {
        bestStudyBlock: '06:30-08:00',
        bestRevisionBlock: '20:30-21:00',
      },
      neuroReviseLongTermRetentionTrend: trend,
      syllabusFlowPredictedCompletionDate: toIsoDate(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 4, 15))),
    };
  }

  private ensureCommunityState(userId: string): CommunityState {
    const existing = this.communityByUser.get(userId);
    if (existing) {
      return existing;
    }

    const state: CommunityState = {
      forumMessages: [
        {
          id: randomUUID(),
          topicId: 'polity-federalism',
          userId,
          message: 'Can someone explain cooperative vs competitive federalism with a current affairs example?',
          createdAt: new Date().toISOString(),
        },
      ],
    };
    this.communityByUser.set(userId, state);
    return state;
  }
}

export const createPostLaunchService = () => new PostLaunchService();
