import apiClient from './api-client';

export type ChatMode = 'rapid_fire' | 'deep_concept' | 'elimination_training' | 'trap_questions';

export type ChatQuestion = {
  prompt: string;
  options: Array<{ key: string; text: string }>;
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

export type ChatMessage = {
  actor: 'user' | 'assistant';
  text: string;
  createdAt: string;
  question?: ChatQuestion;
  isCorrect?: boolean;
};

export type ChatSession = {
  id: string;
  userId: string;
  title: string;
  mode: ChatMode;
  subject: string;
  topic: string;
  messages: ChatMessage[];
  pendingQuestion: ChatQuestion | null;
  performance: {
    attempted: number;
    correct: number;
    accuracy: number;
  };
  difficultyLevel: number;
  isComplete: boolean;
  targetQuestions: number;
  createdAt: string;
  updatedAt: string;
};

export const chatApi = {
  createSession: (data: { mode: ChatMode; subject: string; topic: string; title?: string }) =>
    apiClient.post<ChatSession>('/chat/session', data),

  getSession: (sessionId: string) => apiClient.get<ChatSession>(`/chat/session/${sessionId}`),

  sendMessage: (sessionId: string, message: string) =>
    apiClient.post<{
      session: ChatSession;
      response: string;
      isCorrect?: boolean;
      summary?: { attempted: number; correct: number; accuracy: number; difficultyLevel: number };
    }>(`/chat/session/${sessionId}/message`, { message }),

  sendMessageStream: async (
    sessionId: string,
    message: string,
    onChunk: (chunk: string) => void,
  ): Promise<{ isCorrect?: boolean; summary?: { attempted: number; correct: number; accuracy: number; difficultyLevel: number } }> => {
    const token = typeof window !== 'undefined' ? window.localStorage.getItem('accessToken') : null;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001/api/v1';
    const response = await fetch(`${baseUrl}/chat/session/${sessionId}/message/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok || !response.body) {
      throw new Error('Failed to stream chat response');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let finalResult: { isCorrect?: boolean; summary?: { attempted: number; correct: number; accuracy: number; difficultyLevel: number } } = {};

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      events.forEach((eventBlock) => {
        const lines = eventBlock.split('\n');
        const eventType = lines.find((line) => line.startsWith('event:'))?.replace('event:', '').trim();
        const dataLine = lines.find((line) => line.startsWith('data:'))?.replace('data:', '').trim();
        if (!dataLine) {
          return;
        }

        let payload;
        try {
          payload = JSON.parse(dataLine) as {
            chunk?: string;
            isCorrect?: boolean;
            summary?: { attempted: number; correct: number; accuracy: number; difficultyLevel: number };
          };
        } catch (e) {
          console.warn('Failed to parse SSE data stream chunk', e);
          return;
        }

        if (eventType === 'done') {
          finalResult = { isCorrect: payload.isCorrect, summary: payload.summary };
          return;
        }

        if (payload.chunk) {
          onChunk(payload.chunk);
        }
      });
    }

    return finalResult;
  },

  listSessions: (limit = 10) => apiClient.get<ChatSession[]>('/chat/sessions', { params: { limit } }),
};
