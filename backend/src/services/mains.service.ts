import { randomUUID } from 'crypto';

import { AppError } from '../errors/app-error.js';
import { createKnowledgeGraphService, type KnowledgeGraphService } from './knowledge-graph.service.js';

export type MainsQuestionType = 'gs' | 'essay' | 'ethics' | 'optional';
export type MainsQuestionSource = 'pyq' | 'coaching' | 'ai_generated';

export type MainsQuestion = {
  id: string;
  topicId: string;
  type: MainsQuestionType;
  source: MainsQuestionSource;
  marks: number;
  questionText: string;
  modelAnswer: string | null;
  suggestedWordLimit: number;
  year: number | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateMainsQuestionInput = Omit<MainsQuestion, 'id' | 'createdAt' | 'updatedAt'>;

type ListMainsQuestionsFilters = {
  topicId?: string;
  type?: MainsQuestionType;
  source?: MainsQuestionSource;
  marks?: number;
  search?: string;
  limit?: number;
  offset?: number;
};

type MainsServiceOptions = {
  knowledgeGraphService?: KnowledgeGraphService;
  seedData?: boolean;
};

const mainsTypes: MainsQuestionType[] = ['gs', 'essay', 'ethics', 'optional'];
const mainsSources: MainsQuestionSource[] = ['pyq', 'coaching', 'ai_generated'];
const mainsMarks = [10, 12, 15] as const;

export class MainsService {
  private readonly questions = new Map<string, MainsQuestion>();

  private readonly knowledgeGraphService: KnowledgeGraphService;

  constructor(options: MainsServiceOptions = {}) {
    this.knowledgeGraphService = options.knowledgeGraphService ?? createKnowledgeGraphService();
    const shouldSeedData = options.seedData ?? true;
    if (shouldSeedData) {
      this.seedInitialQuestions();
    }
  }

  listQuestions(filters: ListMainsQuestionsFilters = {}): { total: number; items: MainsQuestion[] } {
    const normalizedSearch = filters.search?.trim().toLowerCase();
    const filtered = [...this.questions.values()]
      .filter((question) => (filters.topicId ? question.topicId === filters.topicId : true))
      .filter((question) => (filters.type ? question.type === filters.type : true))
      .filter((question) => (filters.source ? question.source === filters.source : true))
      .filter((question) => (filters.marks ? question.marks === filters.marks : true))
      .filter((question) =>
        normalizedSearch ? question.questionText.toLowerCase().includes(normalizedSearch) : true,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const offset = filters.offset ?? 0;
    const limit = filters.limit ?? 20;
    return {
      total: filtered.length,
      items: filtered.slice(offset, offset + limit),
    };
  }

  getQuestionById(id: string): MainsQuestion {
    const question = this.questions.get(id);
    if (!question) {
      throw new AppError('Mains question not found', 404);
    }
    return question;
  }

  createQuestion(input: CreateMainsQuestionInput): MainsQuestion {
    this.knowledgeGraphService.getTopic(input.topicId);

    const now = new Date();
    const question: MainsQuestion = {
      id: randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    this.questions.set(question.id, question);
    return question;
  }

  private seedInitialQuestions(): void {
    if (this.questions.size > 0) {
      return;
    }

    const topics = this.knowledgeGraphService.listAllTopics();
    topics.forEach((topic, topicIndex) => {
      for (let questionIndex = 0; questionIndex < 3; questionIndex += 1) {
        const type = mainsTypes[(topicIndex + questionIndex) % mainsTypes.length]!;
        const source = mainsSources[(topicIndex + questionIndex) % mainsSources.length]!;
        const marks = mainsMarks[questionIndex % mainsMarks.length]!;
        const now = new Date();
        const question: MainsQuestion = {
          id: randomUUID(),
          topicId: topic.id,
          type,
          source,
          marks,
          questionText: `${topic.name}: Critically examine the major developments and assess their implications for policy and governance.`,
          modelAnswer: `Model answer for ${topic.name} covering introduction, analysis, and way forward.`,
          suggestedWordLimit: marks === 15 ? 300 : 250,
          year: source === 'pyq' ? 2015 + ((topicIndex + questionIndex) % 11) : null,
          createdAt: now,
          updatedAt: now,
        };

        this.questions.set(question.id, question);
      }
    });
  }
}

const defaultMainsService = new MainsService();

export const createMainsService = (options: MainsServiceOptions = {}): MainsService => {
  if (Object.keys(options).length === 0) {
    return defaultMainsService;
  }

  return new MainsService(options);
};
