import { randomUUID } from 'crypto';

import { AppError } from '../errors/app-error.js';
import type { ContentNode, ContentNodeType, KnowledgeGraphService } from './knowledge-graph.service.js';
import { createKnowledgeGraphService } from './knowledge-graph.service.js';

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
  title: string | null;
  snippet: string;
};

type LearningServiceOptions = {
  knowledgeGraphService?: KnowledgeGraphService;
  notes?: TopicNote[];
};

const contentTypesByLearningSection: Record<'pyqs' | 'highlights' | 'micro-notes', ContentNodeType> = {
  pyqs: 'pyq',
  highlights: 'highlight',
  'micro-notes': 'micro_note',
};

const ensureContains = (value: string, query: string): boolean => {
  return value.toLowerCase().includes(query.toLowerCase());
};

const toSnippet = (value: string): string => {
  return value.length > 240 ? `${value.slice(0, 240)}...` : value;
};

export class LearningService {
  private readonly knowledgeGraphService: KnowledgeGraphService;

  private readonly notes = new Map<string, TopicNote>();

  private readonly progress = new Map<string, TopicProgress>();

  private readonly highlights = new Map<string, UserHighlight>();

  private readonly bookmarks = new Map<string, UserBookmark>();

  constructor(options: LearningServiceOptions = {}) {
    this.knowledgeGraphService = options.knowledgeGraphService ?? createKnowledgeGraphService();
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

  searchContent(query: string): SearchResult[] {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return [];
    }

    const matchingContent = this.knowledgeGraphService.listAllContentNodes().flatMap((content) => {
      const title = content.title ?? '';
      if (!ensureContains(title, normalizedQuery) && !ensureContains(content.body, normalizedQuery)) {
        return [];
      }

      return [
        {
          id: content.id,
          topicId: content.topicId,
          source: 'content' as const,
          type: content.type,
          title: content.title,
          snippet: toSnippet(content.body),
        },
      ];
    });

    const matchingNotes = [...this.notes.values()].flatMap((note) => {
      if (!ensureContains(note.title, normalizedQuery) && !ensureContains(note.markdown, normalizedQuery)) {
        return [];
      }

      return [
        {
          id: note.id,
          topicId: note.topicId,
          source: 'note' as const,
          type: 'note' as const,
          title: note.title,
          snippet: toSnippet(note.markdown),
        },
      ];
    });

    return [...matchingContent, ...matchingNotes];
  }
}

const defaultLearningService = new LearningService();

export const createLearningService = (options: LearningServiceOptions = {}): LearningService => {
  if (Object.keys(options).length === 0) {
    return defaultLearningService;
  }

  return new LearningService(options);
};
