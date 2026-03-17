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

export type MainsQuestion = {
  id: string;
  topicId: string;
  topicName: string;
  questionText: string;
  marks: number;
  wordLimit: number;
  type: 'pyq' | 'coaching' | 'ai_generated';
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

export type MainsSubmissionItem = {
  id: string;
  questionId: string;
  topicId: string;
  overallScore: number;
  maxScore: number;
  createdAt: string;
};

export type MainsSubmissionsListResponse = {
  items: MainsSubmissionItem[];
  improvementByTopic: Array<{ topicId: string; attempts: number; latestScore: number; improvement: number }>;
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
  listQuestions: () => apiClient.get<{ items: MainsQuestion[] }>('/mains/questions'),
  submitAnswer: (payload: { questionId: string; answerText: string; wordCount?: number }) =>
    apiClient.post<MainsSubmissionResponse>('/mains/submit', payload),
  listSubmissions: () => apiClient.get<MainsSubmissionsListResponse>('/mains/submissions'),
  getSubmission: (id: string) => apiClient.get<MainsSubmissionDetail>(`/mains/submissions/${id}`),
};

export default apiClient;
