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
  getSubjectTopics: (id: string) => apiClient.get(`/knowledge-graph/subjects/${id}/topics`),
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

export type MainsQuestion = {
  id: string;
  topicId: string;
  type: 'gs' | 'essay' | 'ethics' | 'optional';
  source: 'pyq' | 'coaching' | 'ai_generated';
  marks: number;
  questionText: string;
  modelAnswer: string | null;
  suggestedWordLimit: number;
  year: number | null;
  createdAt: string;
  updatedAt: string;
};

export type MainsQuestionsListResponse = {
  items: MainsQuestion[];
  total: number;
  limit: number;
  offset: number;
};

export type MainsQuestionFilters = {
  topicId?: string;
  type?: MainsQuestion['type'];
  source?: MainsQuestion['source'];
  marks?: number;
  search?: string;
  limit?: number;
  offset?: number;
};

export const mainsApi = {
  listQuestions: (filters: MainsQuestionFilters = {}) =>
    apiClient.get<MainsQuestionsListResponse>('/mains/questions', { params: filters }),
  getQuestion: (id: string) => apiClient.get<MainsQuestion>(`/mains/questions/${id}`),
};

export default apiClient;
