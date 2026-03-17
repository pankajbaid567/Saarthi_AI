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

export const knowledgeApi = {
  getSubjects: () => apiClient.get('/knowledge-graph/subjects'),
  getSubject: (id: string) => apiClient.get(`/knowledge-graph/subjects/${id}`),
  getTopic: (id: string) => apiClient.get(`/knowledge-graph/topics/${id}`),
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
    apiClient.get<{ success: boolean; data: FlashcardItem[] }>('/revision/flashcards', {
      params,
    }),
  startSprint: (payload: { durationMinutes: 15 | 30 | 45; crashMode?: boolean; daysRemaining?: number }) =>
    apiClient.post<{
      success: boolean;
      data: { sprintId: string; dailyTargetTopics: number | null; totalTopics: number; topics: Array<{ topicName: string }> };
    }>('/revision/sprint/start', payload),
  startActiveRecall: (payload: { topicIds: string[]; questionCount: number }) =>
    apiClient.post<{
      success: boolean;
      data: { sessionId: string; questions: ActiveRecallQuestion[]; totalQuestions: number };
    }>('/revision/active-recall/start', payload),
  submitActiveRecallAnswer: (
    sessionId: string,
    payload: { questionId: string; userAnswer: string; confidenceLevel?: number },
  ) =>
    apiClient.post<{ success: boolean; data: { questionId: string; score: number } }>(
      `/revision/active-recall/${sessionId}/answer`,
      payload,
    ),
};

export default apiClient;
