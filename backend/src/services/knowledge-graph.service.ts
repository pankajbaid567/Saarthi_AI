import { randomUUID } from 'crypto';

import { AppError } from '../errors/app-error.js';

export type Subject = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Topic = {
  id: string;
  subjectId: string;
  parentTopicId: string | null;
  name: string;
  slug: string;
  description: string | null;
  materializedPath: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ContentNodeType = 'concept' | 'fact' | 'highlight' | 'micro_note' | 'pyq';

export type ContentNode = {
  id: string;
  topicId: string;
  type: ContentNodeType;
  title: string | null;
  body: string;
  createdAt: Date;
  updatedAt: Date;
};

type CreateSubjectInput = {
  name: string;
  slug?: string;
  description?: string | null;
};

type UpdateSubjectInput = Partial<CreateSubjectInput>;

type CreateTopicInput = {
  subjectId: string;
  parentTopicId?: string | null;
  name: string;
  slug?: string;
  description?: string | null;
};

type UpdateTopicInput = Partial<Omit<CreateTopicInput, 'subjectId'>> & {
  subjectId?: string;
};

type CreateContentNodeInput = {
  topicId: string;
  type: ContentNodeType;
  title?: string | null;
  body: string;
};

type UpdateContentNodeInput = Partial<CreateContentNodeInput>;

const toSlug = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 80);
};

const resolveSlug = (input: { providedSlug?: string; providedName?: string; fallbackSlug: string }): string => {
  if (input.providedSlug) {
    return toSlug(input.providedSlug);
  }

  if (input.providedName) {
    return toSlug(input.providedName);
  }

  return input.fallbackSlug;
};

export type KnowledgeGraphServiceOptions = {
  seedData?: boolean;
};

export class KnowledgeGraphService {
  private readonly subjects = new Map<string, Subject>();

  private readonly topics = new Map<string, Topic>();

  private readonly contentNodes = new Map<string, ContentNode>();

  constructor(options: KnowledgeGraphServiceOptions = {}) {
    const shouldSeed = options.seedData ?? true;

    if (shouldSeed) {
      this.seedInitialUpscHierarchy();
    }
  }

  listSubjects(): Subject[] {
    return [...this.subjects.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  getSubject(id: string): Subject {
    const subject = this.subjects.get(id);

    if (!subject) {
      throw new AppError('Subject not found', 404);
    }

    return subject;
  }

  createSubject(input: CreateSubjectInput): Subject {
    const slug = input.slug ? toSlug(input.slug) : toSlug(input.name);

    if (!slug) {
      throw new AppError('Invalid subject slug', 400);
    }

    const hasConflict = [...this.subjects.values()].some(
      (subject) =>
        subject.name.toLowerCase() === input.name.toLowerCase() || subject.slug.toLowerCase() === slug.toLowerCase(),
    );

    if (hasConflict) {
      throw new AppError('Subject already exists', 409);
    }

    const now = new Date();
    const subject: Subject = {
      id: randomUUID(),
      name: input.name,
      slug,
      description: input.description ?? null,
      createdAt: now,
      updatedAt: now,
    };

    this.subjects.set(subject.id, subject);
    return subject;
  }

  updateSubject(id: string, input: UpdateSubjectInput): Subject {
    const current = this.getSubject(id);
    const nextName = input.name ?? current.name;
    const nextSlug = resolveSlug({
      providedSlug: input.slug,
      providedName: input.name,
      fallbackSlug: current.slug,
    });

    const hasConflict = [...this.subjects.values()].some(
      (subject) =>
        subject.id !== id &&
        (subject.name.toLowerCase() === nextName.toLowerCase() ||
          subject.slug.toLowerCase() === nextSlug.toLowerCase()),
    );

    if (hasConflict) {
      throw new AppError('Subject already exists', 409);
    }

    const updated: Subject = {
      ...current,
      name: nextName,
      slug: nextSlug,
      description: input.description ?? current.description,
      updatedAt: new Date(),
    };

    this.subjects.set(id, updated);
    return updated;
  }

  deleteSubject(id: string): void {
    this.getSubject(id);

    const topicIds = [...this.topics.values()].filter((topic) => topic.subjectId === id).map((topic) => topic.id);

    topicIds.forEach((topicId) => this.deleteTopic(topicId));
    this.subjects.delete(id);
  }

  listTopicsForSubject(subjectId: string): Topic[] {
    this.getSubject(subjectId);
    return [...this.topics.values()]
      .filter((topic) => topic.subjectId === subjectId)
      .sort((a, b) => a.materializedPath.localeCompare(b.materializedPath));
  }

  getTopicWithSubtopics(id: string): { topic: Topic; subtopics: Topic[] } {
    const topic = this.getTopic(id);
    const subtopics = this.getSubtopics(id);

    return {
      topic,
      subtopics,
    };
  }

  getTopic(id: string): Topic {
    const topic = this.topics.get(id);

    if (!topic) {
      throw new AppError('Topic not found', 404);
    }

    return topic;
  }

  getSubtopics(id: string): Topic[] {
    this.getTopic(id);

    return [...this.topics.values()]
      .filter((topic) => topic.parentTopicId === id)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  createTopic(input: CreateTopicInput): Topic {
    this.getSubject(input.subjectId);

    if (input.parentTopicId) {
      const parent = this.getTopic(input.parentTopicId);
      if (parent.subjectId !== input.subjectId) {
        throw new AppError('Parent topic must belong to the same subject', 400);
      }
    }

    const topicId = randomUUID();
    const slug = input.slug ? toSlug(input.slug) : toSlug(input.name);

    if (!slug) {
      throw new AppError('Invalid topic slug', 400);
    }

    const parentPath = input.parentTopicId ? this.getTopic(input.parentTopicId).materializedPath : null;
    const now = new Date();
    const topic: Topic = {
      id: topicId,
      subjectId: input.subjectId,
      parentTopicId: input.parentTopicId ?? null,
      name: input.name,
      slug,
      description: input.description ?? null,
      materializedPath: parentPath ? `${parentPath}.${topicId}` : `${input.subjectId}.${topicId}`,
      createdAt: now,
      updatedAt: now,
    };

    this.topics.set(topic.id, topic);
    return topic;
  }

  updateTopic(id: string, input: UpdateTopicInput): Topic {
    const current = this.getTopic(id);
    const nextSubjectId = input.subjectId ?? current.subjectId;
    const nextParentId = input.parentTopicId === undefined ? current.parentTopicId : input.parentTopicId;

    this.getSubject(nextSubjectId);

    if (nextParentId) {
      const parent = this.getTopic(nextParentId);

      if (parent.id === id) {
        throw new AppError('Topic cannot be its own parent', 400);
      }

      if (parent.subjectId !== nextSubjectId) {
        throw new AppError('Parent topic must belong to the same subject', 400);
      }

      if (parent.materializedPath.startsWith(`${current.materializedPath}.`)) {
        throw new AppError('Topic cannot move under its own descendant', 400);
      }
    }

    const oldPath = current.materializedPath;
    const parentPath = nextParentId ? this.getTopic(nextParentId).materializedPath : null;

    const updated: Topic = {
      ...current,
      subjectId: nextSubjectId,
      parentTopicId: nextParentId ?? null,
      name: input.name ?? current.name,
      slug: resolveSlug({
        providedSlug: input.slug,
        providedName: input.name,
        fallbackSlug: current.slug,
      }),
      description: input.description ?? current.description,
      materializedPath: parentPath ? `${parentPath}.${id}` : `${nextSubjectId}.${id}`,
      updatedAt: new Date(),
    };

    this.topics.set(id, updated);

    if (updated.materializedPath !== oldPath || updated.subjectId !== current.subjectId) {
      this.rewriteDescendantPaths(id, oldPath, updated.materializedPath, updated.subjectId);
    }

    return updated;
  }

  deleteTopic(id: string): void {
    const topic = this.getTopic(id);
    const prefix = `${topic.materializedPath}.`;

    const topicIds = [...this.topics.values()]
      .filter((item) => item.id === id || item.materializedPath.startsWith(prefix))
      .map((item) => item.id);

    const contentIds = [...this.contentNodes.values()]
      .filter((node) => topicIds.includes(node.topicId))
      .map((node) => node.id);

    contentIds.forEach((contentId) => this.contentNodes.delete(contentId));
    topicIds.forEach((topicId) => this.topics.delete(topicId));
  }

  getTopicContent(topicId: string): ContentNode[] {
    this.getTopic(topicId);

    return [...this.contentNodes.values()]
      .filter((content) => content.topicId === topicId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  listAllTopics(): Topic[] {
    return [...this.topics.values()];
  }

  listAllContentNodes(): ContentNode[] {
    return [...this.contentNodes.values()];
  }

  getContentNodeById(id: string): ContentNode {
    return this.getContentNode(id);
  }

  createContentNode(input: CreateContentNodeInput): ContentNode {
    this.getTopic(input.topicId);

    const now = new Date();
    const contentNode: ContentNode = {
      id: randomUUID(),
      topicId: input.topicId,
      type: input.type,
      title: input.title ?? null,
      body: input.body,
      createdAt: now,
      updatedAt: now,
    };

    this.contentNodes.set(contentNode.id, contentNode);
    return contentNode;
  }

  updateContentNode(id: string, input: UpdateContentNodeInput): ContentNode {
    const current = this.getContentNode(id);

    if (input.topicId) {
      this.getTopic(input.topicId);
    }

    const updated: ContentNode = {
      ...current,
      topicId: input.topicId ?? current.topicId,
      type: input.type ?? current.type,
      title: input.title === undefined ? current.title : input.title,
      body: input.body ?? current.body,
      updatedAt: new Date(),
    };

    this.contentNodes.set(id, updated);
    return updated;
  }

  deleteContentNode(id: string): void {
    this.getContentNode(id);
    this.contentNodes.delete(id);
  }

  private getContentNode(id: string): ContentNode {
    const contentNode = this.contentNodes.get(id);

    if (!contentNode) {
      throw new AppError('Content node not found', 404);
    }

    return contentNode;
  }

  private rewriteDescendantPaths(topicId: string, oldPath: string, newPath: string, nextSubjectId: string): void {
    const descendants = [...this.topics.values()].filter(
      (topic) => topic.id !== topicId && topic.materializedPath.startsWith(`${oldPath}.`),
    );

    descendants.forEach((descendant) => {
      const rewrittenPath = descendant.materializedPath.replace(oldPath, newPath);
      this.topics.set(descendant.id, {
        ...descendant,
        subjectId: nextSubjectId,
        materializedPath: rewrittenPath,
        updatedAt: new Date(),
      });
    });
  }

  private seedInitialUpscHierarchy(): void {
    if (this.subjects.size > 0 || this.topics.size > 0) {
      return;
    }

    const subjects = [
      'History',
      'Geography',
      'Polity',
      'Economy',
      'Environment',
      'Science and Technology',
      'International Relations',
      'Current Affairs',
    ];

    subjects.forEach((subjectName) => {
      const subject = this.createSubject({
        name: subjectName,
        slug: toSlug(subjectName),
        description: `${subjectName} for UPSC preparation`,
      });

      const rootTopics: Topic[] = [];
      for (let index = 1; index <= 20; index += 1) {
        rootTopics.push(
          this.createTopic({
            subjectId: subject.id,
            name: `${subjectName} Topic ${index}`,
            slug: `${toSlug(subjectName)}-topic-${index}`,
            description: `Core ${subjectName} topic ${index}`,
          }),
        );
      }

      for (let index = 1; index <= 6; index += 1) {
        this.createTopic({
          subjectId: subject.id,
          parentTopicId: rootTopics[index - 1]?.id,
          name: `${subjectName} Subtopic ${index}`,
          slug: `${toSlug(subjectName)}-subtopic-${index}`,
          description: `Detailed ${subjectName} subtopic ${index}`,
        });
      }
    });
  }
}

const defaultKnowledgeGraphService = new KnowledgeGraphService();

export const createKnowledgeGraphService = (
  options: KnowledgeGraphServiceOptions = {},
): KnowledgeGraphService => {
  if (Object.keys(options).length === 0) {
    return defaultKnowledgeGraphService;
  }

  return new KnowledgeGraphService(options);
};
