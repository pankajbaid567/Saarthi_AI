import apiClient from './api-client';

export type LearningSearchResult = {
  id: string;
  topicId: string;
  source: 'content' | 'note';
  type: string;
  subject: string;
  topic: string;
  title: string | null;
  snippet: string;
  score: number;
};

export type LearningSearchResponse =
  | LearningSearchResult[]
  | {
      results: LearningSearchResult[];
      rag: {
        understanding: { intent: string; entities: string[] };
        context: string;
        sources: Array<{ id: string; source: 'content' | 'note'; type: string; title: string | null; topic: string; subject: string }>;
      };
    };

export const learningApi = {
  searchContent: (params: {
    q: string;
    type?: string;
    subject?: string;
    topic?: string;
    includeContext?: boolean;
  }) => apiClient.get<LearningSearchResponse>('/content/search', { params }),
  getRelatedContent: (topicId: string) => apiClient.get<LearningSearchResult[]>(`/topics/${topicId}/related-content`),
};
