import { randomUUID } from 'crypto';

import { AppError } from '../errors/app-error.js';
import { createEmbeddingService, type EmbeddingService } from './embedding.service.js';
import type { ContentNode, ContentNodeType, KnowledgeGraphService } from './knowledge-graph.service.js';
import { createKnowledgeGraphService } from './knowledge-graph.service.js';
import { RagService } from './rag.service.js';
import { VectorSearchService, type VectorSearchDocument } from './vector-search.service.js';

type TopicNote = {
  id: string;
  topicId: string;
  title: string;
  markdown: string;
  createdAt: Date;
  updatedAt: Date;
};

type TopicProgress = {
  id: string;
  userId: string;
  topicId: string;
  progressPercent: number;
  completed: boolean;
  updatedAt: Date;
};

type UserHighlight = {
  id: string;
  userId: string;
  topicId: string;
  contentNodeId: string | null;
  highlightedText: string;
  note: string | null;
  createdAt: Date;
};

type UserBookmark = {
  id: string;
  userId: string;
  topicId: string;
  contentNodeId: string | null;
  title: string;
  note: string | null;
  createdAt: Date;
};

type MarkTopicProgressInput = {
  progressPercent?: number;
  completed?: boolean;
};

type CreateUserHighlightInput = {
  topicId: string;
  contentNodeId?: string;
  highlightedText: string;
  note?: string | null;
};

type CreateUserBookmarkInput = {
  topicId: string;
  contentNodeId?: string;
  title: string;
  note?: string | null;
};

type SearchResult = {
  id: string;
  topicId: string;
  source: 'content' | 'note';
  type: ContentNodeType | 'note';
  subject: string;
  topic: string;
  title: string | null;
  snippet: string;
  score: number;
};

type LearningServiceOptions = {
  knowledgeGraphService?: KnowledgeGraphService;
  embeddingService?: EmbeddingService;
  notes?: TopicNote[];
};

type SearchContentOptions = {
  type?: string;
  subject?: string;
  topic?: string;
};

const contentTypesByLearningSection: Record<'pyqs' | 'highlights' | 'micro-notes', ContentNodeType> = {
  pyqs: 'pyq',
  highlights: 'highlight',
  'micro-notes': 'micro_note',
};

const toSnippet = (value: string): string => {
  return value.length > 240 ? `${value.slice(0, 240)}...` : value;
};

export class LearningService {
  private readonly knowledgeGraphService: KnowledgeGraphService;

  private readonly embeddingService: EmbeddingService;

  private readonly vectorSearchService: VectorSearchService;

  private readonly ragService: RagService;

  private readonly notes = new Map<string, TopicNote>();

  private readonly progress = new Map<string, TopicProgress>();

  private readonly highlights = new Map<string, UserHighlight>();

  private readonly bookmarks = new Map<string, UserBookmark>();

  constructor(options: LearningServiceOptions = {}) {
    this.knowledgeGraphService = options.knowledgeGraphService ?? createKnowledgeGraphService();
    this.embeddingService = options.embeddingService ?? createEmbeddingService();
    this.vectorSearchService = new VectorSearchService(this.embeddingService);
    this.ragService = new RagService(this.vectorSearchService);
    (options.notes ?? []).forEach((note) => {
      this.notes.set(note.id, note);
    });
  }

  getTopicNotes(topicId: string): TopicNote[] {
    this.knowledgeGraphService.getTopic(topicId);

    const customNotes = [...this.notes.values()].filter((note) => note.topicId === topicId);
    if (customNotes.length > 0) {
      return customNotes.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }

    return this.knowledgeGraphService
      .getTopicContent(topicId)
      .filter((content) => content.type === 'concept')
      .map((content) => ({
        id: content.id,
        topicId: content.topicId,
        title: content.title ?? 'Concept Note',
        markdown: content.body,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
      }));
  }

  getTopicSectionContent(topicId: string, section: 'pyqs' | 'highlights' | 'micro-notes'): ContentNode[] {
    this.knowledgeGraphService.getTopic(topicId);
    return this.knowledgeGraphService
      .getTopicContent(topicId)
      .filter((content) => content.type === contentTypesByLearningSection[section]);
  }

  markTopicProgress(userId: string, topicId: string, input: MarkTopicProgressInput): TopicProgress {
    this.knowledgeGraphService.getTopic(topicId);

    const key = `${userId}:${topicId}`;
    const existing = this.progress.get(key);
    const nextProgressPercent =
      input.progressPercent ?? (input.completed ? 100 : existing?.progressPercent ?? 0);
    const completed = input.completed ?? existing?.completed ?? nextProgressPercent >= 100;
    const now = new Date();
    const updated: TopicProgress = {
      id: existing?.id ?? randomUUID(),
      userId,
      topicId,
      progressPercent: Math.max(0, Math.min(100, nextProgressPercent)),
      completed,
      updatedAt: now,
    };

    this.progress.set(key, updated);
    return updated;
  }

  getOverallProgress(userId: string): {
    summary: { totalTopics: number; completedTopics: number; inProgressTopics: number; completionRate: number };
    items: TopicProgress[];
  } {
    const items = [...this.progress.values()]
      .filter((entry) => entry.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const completedTopics = items.filter((entry) => entry.completed).length;
    const inProgressTopics = items.filter((entry) => entry.progressPercent > 0 && !entry.completed).length;
    const totalTopics = this.knowledgeGraphService.listAllTopics().length;

    return {
      summary: {
        totalTopics,
        completedTopics,
        inProgressTopics,
        completionRate: totalTopics === 0 ? 0 : Number(((completedTopics / totalTopics) * 100).toFixed(2)),
      },
      items,
    };
  }

  createUserHighlight(userId: string, input: CreateUserHighlightInput): UserHighlight {
    this.knowledgeGraphService.getTopic(input.topicId);
    if (input.contentNodeId) {
      const contentNode = this.knowledgeGraphService.getContentNodeById(input.contentNodeId);
      if (contentNode.topicId !== input.topicId) {
        throw new AppError('Content node does not belong to topic', 400);
      }
    }

    const highlight: UserHighlight = {
      id: randomUUID(),
      userId,
      topicId: input.topicId,
      contentNodeId: input.contentNodeId ?? null,
      highlightedText: input.highlightedText,
      note: input.note ?? null,
      createdAt: new Date(),
    };

    this.highlights.set(highlight.id, highlight);
    return highlight;
  }

  listUserHighlights(userId: string): UserHighlight[] {
    return [...this.highlights.values()]
      .filter((highlight) => highlight.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  deleteUserHighlight(userId: string, highlightId: string): void {
    const highlight = this.highlights.get(highlightId);

    if (!highlight || highlight.userId !== userId) {
      throw new AppError('Highlight not found', 404);
    }

    this.highlights.delete(highlightId);
  }

  createUserBookmark(userId: string, input: CreateUserBookmarkInput): UserBookmark {
    this.knowledgeGraphService.getTopic(input.topicId);
    if (input.contentNodeId) {
      const contentNode = this.knowledgeGraphService.getContentNodeById(input.contentNodeId);
      if (contentNode.topicId !== input.topicId) {
        throw new AppError('Content node does not belong to topic', 400);
      }
    }

    const bookmark: UserBookmark = {
      id: randomUUID(),
      userId,
      topicId: input.topicId,
      contentNodeId: input.contentNodeId ?? null,
      title: input.title,
      note: input.note ?? null,
      createdAt: new Date(),
    };

    this.bookmarks.set(bookmark.id, bookmark);
    return bookmark;
  }

  listUserBookmarks(userId: string): UserBookmark[] {
    return [...this.bookmarks.values()]
      .filter((bookmark) => bookmark.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  deleteUserBookmark(userId: string, bookmarkId: string): void {
    const bookmark = this.bookmarks.get(bookmarkId);

    if (!bookmark || bookmark.userId !== userId) {
      throw new AppError('Bookmark not found', 404);
    }

    this.bookmarks.delete(bookmarkId);
  }

  searchContent(query: string, options: SearchContentOptions = {}): SearchResult[] {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return [];
    }

    const documents = this.buildSearchDocuments();
    const results = this.vectorSearchService.hybridSearch(normalizedQuery, documents, {
      type: options.type,
      subject: options.subject,
      topic: options.topic,
      limit: 30,
    });

    return results.map((result) => ({
      id: result.id,
      topicId: result.topicId,
      source: result.source,
      type: result.type as ContentNodeType | 'note',
      subject: result.subject,
      topic: result.topic,
      title: result.title,
      snippet: toSnippet(result.highlight.replace(/<\/?mark>/g, '')),
      score: result.score,
    }));
  }

  getSearchContext(query: string): {
    understanding: { intent: 'quiz' | 'search' | 'revise' | 'explain'; entities: string[] };
    context: string;
    sources: Array<{ id: string; source: 'content' | 'note'; type: string; title: string | null; topic: string; subject: string }>;
  } {
    const rag = this.ragService.assembleContext(query, this.buildSearchDocuments());
    return {
      understanding: rag.understanding,
      context: rag.contextText,
      sources: rag.sources.map((source) => ({
        id: source.id,
        source: source.source,
        type: source.type,
        title: source.title,
        topic: source.topic,
        subject: source.subject,
      })),
    };
  }

  getRelatedContent(topicId: string, limit = 5): SearchResult[] {
    const topic = this.knowledgeGraphService.getTopic(topicId);
    const query = topic.name;
    return this.searchContent(query)
      .filter((result) => result.topicId !== topicId)
      .slice(0, limit);
  }

  private buildSearchDocuments(): VectorSearchDocument[] {
    const topicsById = new Map(this.knowledgeGraphService.listAllTopics().map((topic) => [topic.id, topic]));
    const subjectsById = new Map(this.knowledgeGraphService.listSubjects().map((subject) => [subject.id, subject]));
    const contentNodes = this.knowledgeGraphService.listAllContentNodes();
    this.embeddingService.generateEmbeddingsForAllContent(contentNodes);

    const contentDocuments: VectorSearchDocument[] = contentNodes.map((content) => {
      const topic = topicsById.get(content.topicId);
      const subject = topic ? subjectsById.get(topic.subjectId) : null;
      return {
        id: content.id,
        topicId: content.topicId,
        source: 'content',
        type: content.type,
        title: content.title,
        body: content.body,
        topic: topic?.name ?? 'Unknown topic',
        subject: subject?.name ?? 'Unknown subject',
      };
    });

    const noteDocuments: VectorSearchDocument[] = [...this.notes.values()].map((note) => {
      const topic = topicsById.get(note.topicId);
      const subject = topic ? subjectsById.get(topic.subjectId) : null;
      return {
        id: note.id,
        topicId: note.topicId,
        source: 'note',
        type: 'note',
        title: note.title,
        body: note.markdown,
        topic: topic?.name ?? 'Unknown topic',
        subject: subject?.name ?? 'Unknown subject',
      };
    });

    return [...contentDocuments, ...noteDocuments];
  }
}

const defaultLearningService = new LearningService();

export const createLearningService = (options: LearningServiceOptions = {}): LearningService => {
  if (Object.keys(options).length === 0) {
    return defaultLearningService;
  }

  return new LearningService(options);
};
