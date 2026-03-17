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

export default apiClient;
