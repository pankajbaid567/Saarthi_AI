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
