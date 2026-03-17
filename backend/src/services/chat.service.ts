import { randomUUID } from 'crypto';

import { AppError } from '../errors/app-error.js';
import type { ChatMode } from '../models/chat-session.model.js';
import type { ContentNode, KnowledgeGraphService } from './knowledge-graph.service.js';
import { createKnowledgeGraphService } from './knowledge-graph.service.js';

type ChatQuestion = {
  prompt: string;
  options: Array<{ key: string; text: string }>;
  correctAnswer: string;
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

type ChatMessage = {
  actor: 'user' | 'assistant';
  text: string;
  createdAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
};

type CreateSessionInput = {
  userId: string;
  mode: ChatMode;
  subject: string;
  topic: string;
  title?: string;
};

type SendMessageInput = {
  userId: string;
  sessionId: string;
  message: string;
};

type SendMessageResult = {
  session: ChatSession;
  response: string;
  isCorrect?: boolean;
  summary?: {
    attempted: number;
    correct: number;
    accuracy: number;
    difficultyLevel: number;
  };
};

const MODE_HINTS: Record<ChatMode, string> = {
  rapid_fire: 'Rapid Fire: keep answers quick. Brief feedback only.',
  deep_concept: 'Deep Concept: detailed conceptual explanations are enabled.',
  elimination_training: 'Elimination Training: remove wrong choices first.',
  trap_questions: 'Trap Questions: watch out for commonly confused pairs.',
};

const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;

const toDifficulty = (difficultyLevel: number): 'easy' | 'medium' | 'hard' => {
  if (difficultyLevel <= 1) {
    return 'easy';
  }
  if (difficultyLevel === 2) {
    return 'medium';
  }
  return 'hard';
};

const stripPrefix = (value: string): string => {
  return value
    .replace(/^\s*[A-D]\s*[).:-]?\s*/i, '')
    .trim()
    .toLowerCase();
};

const parseDesiredQuestionCount = (message: string): number | null => {
  const countMatch = message.match(/ask\s+(\d{1,2})\s+mcq/i) ?? message.match(/(\d{1,2})\s+mcq/i);
  if (!countMatch) {
    return null;
  }

  const parsed = Number(countMatch[1]);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return Math.max(1, Math.min(20, parsed));
};

const parseTopicIntent = (message: string): string | null => {
  const onTopic = message.match(/on\s+([a-z0-9\s-]{3,})/i);
  if (onTopic?.[1]) {
    return onTopic[1].trim();
  }

  const aboutTopic = message.match(/about\s+([a-z0-9\s-]{3,})/i);
  if (aboutTopic?.[1]) {
    return aboutTopic[1].trim();
  }

  return null;
};

const buildOptions = (content: ContentNode[]): Array<{ key: string; text: string }> => {
  const fallback = ['Only statement I', 'Only statement II', 'Both statements', 'Neither statement'];
  return OPTION_KEYS.map((key, index) => ({
    key,
    text: content[index]?.title ?? fallback[index] ?? `Option ${key}`,
  }));
};

export class ChatService {
  private readonly sessions = new Map<string, ChatSession>();

  private readonly knowledgeGraphService: KnowledgeGraphService;

  constructor(knowledgeGraphService?: KnowledgeGraphService) {
    this.knowledgeGraphService = knowledgeGraphService ?? createKnowledgeGraphService();
  }

  createSession(input: CreateSessionInput): ChatSession {
    const now = new Date();
    const session: ChatSession = {
      id: randomUUID(),
      userId: input.userId,
      title: input.title ?? `${input.topic} quiz chat`,
      mode: input.mode,
      subject: input.subject,
      topic: input.topic,
      messages: [
        {
          actor: 'assistant',
          text: `Started ${input.mode.replaceAll('_', ' ')} mode for ${input.topic}. ${MODE_HINTS[input.mode]}`,
          createdAt: now,
        },
      ],
      pendingQuestion: null,
      performance: {
        attempted: 0,
        correct: 0,
        accuracy: 0,
      },
      difficultyLevel: 1,
      isComplete: false,
      targetQuestions: 10,
      createdAt: now,
      updatedAt: now,
    };

    this.sessions.set(session.id, session);
    return session;
  }

  getSession(sessionId: string, userId: string): ChatSession {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId) {
      throw new AppError('Chat session not found', 404);
    }

    return session;
  }

  listSessions(userId: string, limit = 10): ChatSession[] {
    return [...this.sessions.values()]
      .filter((session) => session.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
      .slice(0, limit);
  }

  sendMessage(input: SendMessageInput): SendMessageResult {
    const session = this.getSession(input.sessionId, input.userId);
    if (session.isComplete) {
      return {
        session,
        response: 'This session is complete. Start a new chat session to continue.',
        summary: {
          attempted: session.performance.attempted,
          correct: session.performance.correct,
          accuracy: session.performance.accuracy,
          difficultyLevel: session.difficultyLevel,
        },
      };
    }

    const now = new Date();
    const message = input.message.trim();
    session.messages.push({ actor: 'user', text: message, createdAt: now });

    const requestedCount = parseDesiredQuestionCount(message);
    if (requestedCount) {
      session.targetQuestions = requestedCount;
    }

    const requestedTopic = parseTopicIntent(message);
    if (requestedTopic) {
      session.topic = requestedTopic;
    }

    if (/(finish|end session|stop quiz)/i.test(message)) {
      session.isComplete = true;
      session.updatedAt = new Date();
      const summary = {
        attempted: session.performance.attempted,
        correct: session.performance.correct,
        accuracy: session.performance.accuracy,
        difficultyLevel: session.difficultyLevel,
      };
      const response =
        `Session complete. Score: ${summary.correct}/${summary.attempted || 0} ` +
        `(${summary.accuracy}%). Final difficulty level: ${summary.difficultyLevel}.`;
      session.messages.push({ actor: 'assistant', text: response, createdAt: session.updatedAt });
      return { session, response, summary };
    }

    if (session.pendingQuestion) {
      const evaluation = this.evaluateAnswer(session, message);
      session.updatedAt = new Date();
      return evaluation;
    }

    const question = this.generateQuestion(session);
    session.pendingQuestion = question;
    const response = this.formatQuestionResponse(session.mode, question);
    session.messages.push({ actor: 'assistant', text: response, question, createdAt: now });
    session.updatedAt = new Date();

    return { session, response };
  }

  buildSseChunks(text: string): string[] {
    const words = text.split(' ').filter(Boolean);
    if (words.length <= 1) {
      return [text];
    }

    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += 8) {
      chunks.push(words.slice(i, i + 8).join(' '));
    }

    return chunks;
  }

  private generateQuestion(session: ChatSession): ChatQuestion {
    const normalizedTopic = session.topic.toLowerCase();
    const matchingTopic = this.knowledgeGraphService
      .listAllTopics()
      .find((topic) => topic.name.toLowerCase().includes(normalizedTopic));

    const contentPool = matchingTopic
      ? this.knowledgeGraphService.getTopicContent(matchingTopic.id)
      : this.knowledgeGraphService.listAllContentNodes().slice(0, 8);

    const difficulty = toDifficulty(session.difficultyLevel);
    const options = buildOptions(contentPool);
    const correctIndex = Math.min(session.performance.attempted % OPTION_KEYS.length, OPTION_KEYS.length - 1);
    const correctAnswer = OPTION_KEYS[correctIndex];
    const selected = options[correctIndex]?.text ?? options[0]?.text ?? 'Correct option';

    const prompt = `(${difficulty.toUpperCase()}) ${session.topic}: Choose the best answer based on core concepts.`;

    return {
      prompt,
      options,
      correctAnswer,
      explanation: `${selected} is the best choice because it aligns with the core ${session.topic} concept in current study material.`,
      topic: session.topic,
      difficulty,
    };
  }

  private evaluateAnswer(session: ChatSession, answer: string): SendMessageResult {
    const question = session.pendingQuestion;
    if (!question) {
      throw new AppError('No pending question in chat session', 400);
    }

    const normalizedAnswer = stripPrefix(answer);
    const selectedKey = answer.trim().slice(0, 1).toUpperCase();
    const selectedOption = question.options.find((option) => option.key === selectedKey);
    const normalizedOption = selectedOption ? stripPrefix(selectedOption.text) : '';

    const isCorrect =
      selectedKey === question.correctAnswer ||
      normalizedAnswer === stripPrefix(question.correctAnswer) ||
      normalizedAnswer === normalizedOption;

    session.performance.attempted += 1;
    if (isCorrect) {
      session.performance.correct += 1;
      session.difficultyLevel = Math.min(3, session.difficultyLevel + 1);
    } else {
      session.difficultyLevel = Math.max(1, session.difficultyLevel - 1);
    }
    session.performance.accuracy = Number(
      ((session.performance.correct / Math.max(1, session.performance.attempted)) * 100).toFixed(2),
    );

    const baseExplanation = isCorrect
      ? `✅ Correct. ${question.explanation}`
      : `❌ Not quite. Correct answer: ${question.correctAnswer}. ${question.explanation}`;

    const modeSpecificNote =
      session.mode === 'rapid_fire'
        ? 'Rapid Fire feedback: move to next quickly.'
        : session.mode === 'deep_concept'
          ? 'Deep Concept insight: connect this with constitutional principles and exceptions.'
          : session.mode === 'elimination_training'
            ? 'Elimination tip: reject options that are extreme or absolute first.'
            : 'Trap alert: similar looking options often differ in one keyword.';

    const response = `${baseExplanation}\n\n${modeSpecificNote}`;
    const createdAt = new Date();

    session.messages.push({
      actor: 'assistant',
      text: response,
      createdAt,
      question,
      isCorrect,
    });

    session.pendingQuestion = null;

    if (session.performance.attempted >= session.targetQuestions) {
      session.isComplete = true;
      const summary = {
        attempted: session.performance.attempted,
        correct: session.performance.correct,
        accuracy: session.performance.accuracy,
        difficultyLevel: session.difficultyLevel,
      };
      const completionText =
        `\n\n🎯 Session target reached (${session.targetQuestions} questions). ` +
        `Final score: ${summary.correct}/${summary.attempted} (${summary.accuracy}%).`;
      const finalResponse = `${response}${completionText}`;
      session.messages.push({ actor: 'assistant', text: completionText.trim(), createdAt: new Date() });
      return { session, response: finalResponse, isCorrect, summary };
    }

    return { session, response, isCorrect };
  }

  private formatQuestionResponse(mode: ChatMode, question: ChatQuestion): string {
    const options = question.options.map((option) => `${option.key}. ${option.text}`).join('\n');
    const lead =
      mode === 'rapid_fire'
        ? '⏱️ Rapid Fire question:'
        : mode === 'deep_concept'
          ? '🧠 Deep Concept question:'
          : mode === 'elimination_training'
            ? '🧩 Elimination Training question:'
            : '⚠️ Trap Question:';

    return `${lead}\n${question.prompt}\n\n${options}\n\nReply with option letter (A/B/C/D) or full answer text.`;
  }
}

const defaultChatService = new ChatService();

export const createChatService = (knowledgeGraphService?: KnowledgeGraphService): ChatService => {
  if (!knowledgeGraphService) {
    return defaultChatService;
  }

  return new ChatService(knowledgeGraphService);
};
