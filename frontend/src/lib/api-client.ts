import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = window.localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = { name: string; email: string; password: string };

export const authApi = {
  login: (payload: LoginPayload) => apiClient.post('/auth/login', payload),
  register: (payload: RegisterPayload) => apiClient.post('/auth/register', payload),
  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),
};

export type SubjectResponse = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  paper: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TopicResponse = {
  id: string;
  subjectId: string;
  parentTopicId: string | null;
  name: string;
  slug: string;
  description: string | null;
  materializedPath: string;
  createdAt: string;
  updatedAt: string;
};

export type TopicWithSubtopicsResponse = {
  topic: TopicResponse;
  subtopics: TopicResponse[];
};

export const knowledgeApi = {
  getSubjects: () => apiClient.get<SubjectResponse[]>('/knowledge-graph/subjects'),
  getSubject: (id: string) => apiClient.get<SubjectResponse>(`/knowledge-graph/subjects/${id}`),
  getSubjectTopics: (id: string) => apiClient.get<TopicResponse[]>(`/knowledge-graph/subjects/${id}/topics`),
  getTopic: (id: string) => apiClient.get<TopicWithSubtopicsResponse>(`/knowledge-graph/topics/${id}`),
};

export type TestAnalyticsResponse = {
  testId: string;
  overall: {
    totalQuestions: number;
    attemptedQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    skippedAnswers: number;
    accuracy: number;
  };
  accuracyByTopic: Array<{ subject: string; topic: string; correct: number; total: number; accuracy: number }>;
  timeAnalysis: {
    averageSeconds: number;
    medianSeconds: number;
    distribution: Array<{ label: string; count: number }>;
    questionTimes: Array<{ questionId: string; timeSpentSeconds: number }>;
  };
  sillyMistakes: Array<{ questionId: string; subject: string; topic: string; changedFromCorrectToWrong: boolean }>;
  guessingPatterns: {
    fastAnswerThresholdSeconds: number;
    veryFastAnswers: number;
    veryFastIncorrectAnswers: number;
    randomGuessingLikely: boolean;
  };
  conceptGaps: Array<{ subject: string; topic: string; wrongCount: number; total: number; accuracy: number }>;
  ai: {
    weaknessAnalysisPrompt: string;
    insights: string;
    weakAreas: string[];
    suggestedNextSteps: string[];
  };
};

export const testsApi = {
  getAnalytics: (id: string) => apiClient.get<TestAnalyticsResponse>(`/tests/${id}/analytics`),
};

export type MainsGateStatus = {
  date: string;
  requiredMcqs: number;
  attemptedMcqs: number;
  isUnlocked: boolean;
  overrideApplied: boolean;
};

export type MainsDailyQuestionResponse = {
  gateStatus: MainsGateStatus;
  question: { id: string; prompt: string; focusAreas: string[] } | null;
};

export type MainsQuestion = {
  id: string;
  topicId: string;
  topicName: string;
  questionText: string;
  marks: number;
  wordLimit: number;
  type: 'pyq' | 'coaching' | 'ai_generated' | 'gs' | 'essay' | 'ethics' | 'optional';
  source?: 'pyq' | 'coaching' | 'ai_generated';
  suggestedWordLimit?: number;
  evaluationRubric: {
    keywords: string[];
  };
};

export type MainsSubmissionResponse = {
  submissionId: string;
  overallScore: number;
  maxScore: number;
  breakdown: {
    structure: { score: number; maxScore: number; feedback: string };
    content: { score: number; maxScore: number; feedback: string; missingPoints: string[] };
    keywords: { score: number; maxScore: number; present: string[]; missing: string[] };
    presentation: { score: number; maxScore: number; feedback: string };
  };
  improvements: string[];
  modelAnswer: string;
  topperAnswer: string;
  highlightedGaps: string[];
};

export type MainsSubmissionDetail = {
  id: string;
  questionId: string;
  topicId: string;
  answerText: string;
  wordCount: number;
  overallScore: number;
  maxScore: number;
  breakdown: MainsSubmissionResponse['breakdown'];
  improvements: string[];
  highlightedGaps: string[];
  modelAnswer: string;
  topperAnswer: string;
  createdAt: string;
};

export const mainsApi = {
  getGateStatus: () => apiClient.get<MainsGateStatus>('/mains/daily/gate-status'),
  getDailyQuestion: () => apiClient.get<MainsDailyQuestionResponse>('/mains/daily/question'),
  submit: (answer: string) => apiClient.post('/mains/daily/submit', { answer }),

  listQuestions: (filters: {
    topicId?: string;
    type?: MainsQuestion['type'];
    source?: 'pyq' | 'coaching' | 'ai_generated';
    marks?: number;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) => apiClient.get<{ items: MainsQuestion[]; total?: number }>('/mains/questions', { params: filters }),
  getQuestion: (id: string) => apiClient.get<MainsQuestion>(`/mains/questions/${id}`),
  submitAnswer: (payload: { questionId: string; answerText: string; wordCount?: number }) =>
    apiClient.post<MainsSubmissionResponse>('/mains/submit', payload),
  listSubmissions: () =>
    apiClient.get<{
      items: Array<{ id: string; questionId: string; topicId: string; overallScore: number; maxScore: number; createdAt: string }>;
      improvementByTopic: Array<{ topicId: string; attempts: number; latestScore: number; improvement: number }>;
    }>('/mains/submissions'),
  getSubmission: (id: string) => apiClient.get<MainsSubmissionDetail>(`/mains/submissions/${id}`),
};

export const essaysApi = {
  getWeeklyQuestion: () => apiClient.get<{ id: string; week: string; prompt: string; sourceTopics: string[] }>('/essays/weekly/question'),
  submitWeeklyEssay: (answer: string) => apiClient.post('/essays/weekly/submit', { answer }),
  getSubmissions: () => apiClient.get('/essays/submissions'),
};

export const practiceApi = {
  getFeedbackLoop: () => apiClient.get('/practice/feedback-loop'),
  getNonRepetitionStats: () => apiClient.get('/practice/non-repetition/stats'),
};

export type RevisionPrediction = {
  topicId: string;
  topicName: string;
  currentRetention: number;
  predictedRetentionIn7Days: number;
  decayRate: number;
  recommendation: string;
  alert: 'high' | 'moderate';
};

export type FlashcardItem = {
  id: string;
  topicId: string;
  front: string;
  back: string;
  source: 'auto' | 'manual';
  nextReviewAt: string;
  lastRating: 'easy' | 'good' | 'hard' | 'forgot' | null;
};

export type ActiveRecallQuestion = {
  id: string;
  topicId: string;
  type: 'concept_recall' | 'comparison' | 'factual' | 'application';
  questionText: string;
  expectedAnswer: string;
};

export const revisionApi = {
  getPredictions: () =>
    apiClient.get<{
      success: boolean;
      data: {
        predictedToForget: RevisionPrediction[];
        alerts: Array<{ topicId: string; topicName: string; message: string; severity: 'high' | 'moderate' }>;
      };
    }>('/revision/predictions'),
  getStreaks: () =>
    apiClient.get<{
      success: boolean;
      data: {
        current: number;
        longest: number;
        lastRevisionDate: string | null;
        graceDaysRemaining: number;
        history: string[];
      };
    }>('/revision/streaks'),
  getFlashcards: (params?: { due?: boolean; limit?: number }) =>
    apiClient.get<{ success: boolean; data: FlashcardItem[] }>('/revision/flashcards', { params }),
  startSprint: (payload: { durationMinutes: 15 | 30 | 45; crashMode?: boolean; daysRemaining?: number }) =>
    apiClient.post<{ success: boolean; data: { sprintId: string; dailyTargetTopics: number | null; totalTopics: number } }>(
      '/revision/sprint/start',
      payload,
    ),
  startActiveRecall: (payload: { topicIds: string[]; questionCount: number }) =>
    apiClient.post<{ success: boolean; data: { sessionId: string; questions: ActiveRecallQuestion[]; totalQuestions: number } }>(
      '/revision/active-recall/start',
      payload,
    ),
  submitActiveRecallAnswer: (sessionId: string, payload: { questionId: string; userAnswer: string; confidenceLevel?: number }) =>
    apiClient.post<{ success: boolean; data: { questionId: string; score: number } }>(
      `/revision/active-recall/${sessionId}/answer`,
      payload,
    ),
};

export type AutoLinkReviewItem = {
  id: string;
  type: 'mcq' | 'concept' | 'fact' | 'mains_question';
  text: string;
  status: 'pending' | 'approved' | 'rejected' | 'merged';
  topicSuggestion: {
    topicId: string | null;
    confidence: number;
    method: 'keyword' | 'semantic' | 'llm';
    newTopicSuggestion: string | null;
  };
  smartHighlights: string[];
  microNote: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
};

export const week11Api = {
  autoLink: (payload: {
    mcqs?: Array<{ question: string; options: string[]; explanation?: string }>;
    concepts?: Array<{ text: string }>;
    facts?: Array<{ text: string }>;
    mainsQuestions?: Array<{ question: string; marks?: number; modelAnswer?: string }>;
  }) => apiClient.post<AutoLinkReviewItem[]>('/content/auto-link', payload),
  listReviewItems: () => apiClient.get<AutoLinkReviewItem[]>('/admin/review/content'),
  approveReviewItem: (id: string, payload: { topicId?: string; editedText?: string }) =>
    apiClient.post<AutoLinkReviewItem>(`/admin/review/content/${id}/approve`, payload),
  rejectReviewItem: (id: string) => apiClient.post<AutoLinkReviewItem>(`/admin/review/content/${id}/reject`, {}),
};

export type StrategyTask = {
  id: string;
  type: 'study' | 'practice' | 'revision' | 'mains' | 'essay';
  title: string;
  estimatedMinutes: number;
  source: 'SyllabusFlow' | 'NeuroRevise' | 'StrategyEngine';
  completed: boolean;
};

export type StrategyDailyPlan = {
  id: string;
  date: string;
  generatedAt: string;
  tasks: StrategyTask[];
  summary: {
    completionPercent: number;
    weakAreaFocus: string[];
    overloadAdjusted: boolean;
    burnoutRisk: boolean;
    targetDate: string | null;
  };
};

export type StrategyWeekPlan = {
  weekStart: string;
  plans: StrategyDailyPlan[];
  targets: {
    weeklyStudyMinutes: number;
    weeklyPracticeQuestions: number;
    mainsAnswers: number;
    essayCount: number;
  };
};

export type SecondBrainEntry = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  importance: 'low' | 'medium' | 'high';
  source: 'manual' | 'auto';
  createdAt: string;
  updatedAt: string;
};

export const strategyApi = {
  getToday: () => apiClient.get<StrategyDailyPlan>('/strategy/today'),
  getWeek: () => apiClient.get<StrategyWeekPlan>('/strategy/week'),
  generate: (payload?: {
    syllabusCoveragePercent?: number;
    weakAreas?: string[];
    retentionUrgencyCount?: number;
    timeAvailableMinutes?: number;
    targetDate?: string;
    prelimsFocusPercent?: number;
  }) => apiClient.post<{ today: StrategyDailyPlan; week: StrategyWeekPlan }>('/strategy/generate', payload ?? {}),
  completeTask: (taskId: string, completed = true) => apiClient.put<StrategyDailyPlan>(`/strategy/${taskId}/complete`, { completed }),
};

export const secondBrainApi = {
  listEntries: (params?: { q?: string; tag?: string }) => apiClient.get<SecondBrainEntry[]>('/second-brain/entries', { params }),
  createEntry: (payload: { title: string; content: string; tags?: string[]; importance?: 'low' | 'medium' | 'high' }) =>
    apiClient.post<SecondBrainEntry>('/second-brain/entries', payload),
  updateEntry: (id: string, payload: Partial<Pick<SecondBrainEntry, 'title' | 'content' | 'tags' | 'importance'>>) =>
    apiClient.put<SecondBrainEntry>(`/second-brain/entries/${id}`, payload),
  deleteEntry: (id: string) => apiClient.delete(`/second-brain/entries/${id}`),
  getConnections: () =>
    apiClient.get<Array<{ fromTag: string; toTag: string; strength: number; entryIds: string[] }>>('/second-brain/connections'),
  getAutoInsights: () => apiClient.get<Array<{ id: string; insight: string; relatedTags: string[] }>>('/second-brain/insights/auto-generated'),
};

export type PostLaunchCommunityResponse = {
  forumsByTopic: Array<{ topicId: string; topicName: string; threads: number; activeUsers: number }>;
  recentMessages: Array<{ id: string; topicId: string; userId: string; message: string; createdAt: string }>;
  peerAnswerReview: { pendingReviews: number; reviewedThisWeek: number; avgScoreDelta: number };
  studyGroups: Array<{ id: string; name: string; members: number; schedule: string }>;
  leaderboards: {
    revisionStreak: Array<{ userId: string; displayName: string; streakDays: number }>;
    practiceStreak: Array<{ userId: string; displayName: string; streakDays: number }>;
    syllabusCompletion: Array<{ userId: string; displayName: string; completionPercent: number }>;
  };
  refreshedAt: string;
};

export const postLaunchApi = {
  getCommunity: () => apiClient.get<PostLaunchCommunityResponse>('/features/community'),
  addForumMessage: (topicId: string, message: string) =>
    apiClient.post<{ id: string; topicId: string; userId: string; message: string; createdAt: string }>(
      `/features/community/forums/${topicId}/messages`,
      { message },
    ),
  getAdvancedAi: () =>
    apiClient.get<{
      modes: Array<{ id: string; name: string; focus: string }>;
      voiceQuiz: { enabled: boolean; engine: string; languageSupport: string[] };
      neuroReviseGroupPatterns: { strongestForgettingWindowHours: number; recommendedGroupRevisionSlot: string };
      syllabusFlowPeerCalibration: { suggestedDifficulty: string; peerPercentile: number };
    }>('/features/advanced-ai'),
  analyzeError: (payload: { questionId: string; userAnswer: string; correctAnswer: string; topicId?: string }) =>
    apiClient.post<{
      questionId: string;
      conceptGap: 'high' | 'low';
      whyYouGotThisWrong: string;
      neuroReviseContext: { topicId: string; lastRevisionMissProbability: number; nextBestAction: string };
    }>('/features/advanced-ai/error-analysis', payload),
  getContentExpansion: () =>
    apiClient.get<{
      optionalSubjectModules: string[];
      interviewPreparation: { enabled: boolean; mockPanels: number; stressQuestionsBank: number };
      statePcsSupport: string[];
      multiLanguageMicroNotes: { supportedLanguages: string[]; translatedNotesCount: number };
    }>('/features/content-expansion'),
  getMobileCompanion: () =>
    apiClient.get<{
      platform: string;
      offlineMode: { cachedAssets: string[]; maxOfflineDays: number };
      pushNotifications: string[];
      widget: { enabled: boolean; metrics: string[] };
    }>('/features/mobile'),
  getAdvancedAnalytics: () =>
    apiClient.get<{
      comparativeAnalysis: { topperBaselineScore: number; currentUserScore: number; gapAreas: string[] };
      customReportGeneration: { formats: string[]; latestGeneratedAt: string };
      parentMentorDashboard: { enabled: boolean; sharableDigest: boolean; weeklyDigestDay: string };
      studyPatternOptimization: { bestStudyBlock: string; bestRevisionBlock: string };
      neuroReviseLongTermRetentionTrend: Array<{ month: string; retentionPercent: number }>;
      syllabusFlowPredictedCompletionDate: string;
    }>('/features/advanced-analytics'),
};

export default apiClient;
