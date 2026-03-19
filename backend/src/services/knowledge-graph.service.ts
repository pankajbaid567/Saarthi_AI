import { randomUUID } from 'crypto';

import { AppError } from '../errors/app-error.js';

export type Subject = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  paper: string | null;
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

export type ExtractedContentType = 'mcq' | 'concept' | 'fact' | 'mains_question';

export type TopicMatchMethod = 'keyword' | 'semantic' | 'llm';

export type AutoLinkReviewStatus = 'pending' | 'approved' | 'rejected' | 'merged';

export type AutoLinkReviewItem = {
  id: string;
  type: ExtractedContentType;
  text: string;
  topicSuggestion: {
    topicId: string | null;
    confidence: number;
    method: TopicMatchMethod;
    newTopicSuggestion: string | null;
  };
  status: AutoLinkReviewStatus;
  linkedTopicId: string | null;
  editedText: string | null;
  smartHighlights: string[];
  microNote: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  mergedIntoId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CreateSubjectInput = {
  name: string;
  slug?: string;
  description?: string | null;
  paper?: string | null;
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

type ExtractedMcqInput = {
  question: string;
  options: string[];
  explanation?: string;
};

type ExtractedTextContentInput = {
  text: string;
};

type ExtractedMainsQuestionInput = {
  question: string;
  marks?: number;
  modelAnswer?: string;
};

type AutoLinkInput = {
  mcqs?: ExtractedMcqInput[];
  concepts?: ExtractedTextContentInput[];
  facts?: ExtractedTextContentInput[];
  mainsQuestions?: ExtractedMainsQuestionInput[];
};

type ApproveAutoLinkInput = {
  topicId?: string;
  editedText?: string;
};

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'this',
  'that',
  'from',
  'into',
  'are',
  'was',
  'were',
  'have',
  'has',
  'had',
  'will',
  'shall',
  'their',
  'there',
  'about',
  'what',
  'which',
  'when',
  'where',
  'who',
  'whom',
  'your',
  'you',
  'why',
  'how',
  'can',
  'could',
  'would',
  'should',
]);

const MIN_TOKEN_LENGTH = 2;
const TOPIC_MATCH_CONFIDENCE_THRESHOLD = 0.2;
const LLM_KEYWORD_WEIGHT = 0.6;
const LLM_SEMANTIC_WEIGHT = 0.4;
const LLM_PHRASE_BOOST = 0.15;
const MIN_HIGHLIGHT_LENGTH = 15;
const MAX_HIGHLIGHTS = 3;
const MAX_MICRO_NOTE_WORDS = 16;
const EASY_DIFFICULTY_THRESHOLD = 25;
const MEDIUM_DIFFICULTY_THRESHOLD = 45;

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

  private readonly autoLinkReviewItems = new Map<string, AutoLinkReviewItem>();

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
    const paperPrefix = input.paper ? `${input.paper}-` : '';
    const slug = input.slug ? toSlug(input.slug) : toSlug(`${paperPrefix}${input.name}`);

    if (!slug) {
      throw new AppError('Invalid subject slug', 400);
    }

    const hasConflict = [...this.subjects.values()].some(
      (subject) => subject.slug.toLowerCase() === slug.toLowerCase(),
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
      paper: input.paper ?? null,
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
      paper: input.paper === undefined ? current.paper : input.paper ?? current.paper,
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

  autoLinkExtractedContent(input: AutoLinkInput): AutoLinkReviewItem[] {
    const created: AutoLinkReviewItem[] = [];

    input.mcqs?.forEach((mcq) => {
      const text = `${mcq.question}\n${mcq.options.join('\n')}\n${mcq.explanation ?? ''}`.trim();
      created.push(this.createAutoLinkReviewItem('mcq', text));
    });

    input.concepts?.forEach((concept) => {
      created.push(this.createAutoLinkReviewItem('concept', concept.text));
    });

    input.facts?.forEach((fact) => {
      created.push(this.createAutoLinkReviewItem('fact', fact.text));
    });

    input.mainsQuestions?.forEach((question) => {
      const text = `${question.question}${question.marks ? ` (${question.marks} marks)` : ''}${
        question.modelAnswer ? `\n${question.modelAnswer}` : ''
      }`;
      created.push(this.createAutoLinkReviewItem('mains_question', text));
    });

    return created;
  }

  listAutoLinkReviewItems(status?: AutoLinkReviewStatus): AutoLinkReviewItem[] {
    return [...this.autoLinkReviewItems.values()]
      .filter((item) => (status ? item.status === status : true))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  approveAutoLinkReviewItem(id: string, input: ApproveAutoLinkInput = {}): AutoLinkReviewItem {
    const current = this.getAutoLinkReviewItem(id);
    const linkedTopicId = input.topicId ?? current.topicSuggestion.topicId;

    if (!linkedTopicId) {
      throw new AppError('Topic is required to approve the link', 400);
    }

    this.getTopic(linkedTopicId);

    const approved: AutoLinkReviewItem = {
      ...current,
      status: 'approved',
      linkedTopicId,
      editedText: input.editedText ?? current.editedText,
      updatedAt: new Date(),
    };

    this.autoLinkReviewItems.set(id, approved);
    return approved;
  }

  rejectAutoLinkReviewItem(id: string): AutoLinkReviewItem {
    const current = this.getAutoLinkReviewItem(id);
    const rejected: AutoLinkReviewItem = {
      ...current,
      status: 'rejected',
      linkedTopicId: null,
      updatedAt: new Date(),
    };
    this.autoLinkReviewItems.set(id, rejected);
    return rejected;
  }

  mergeAutoLinkReviewItems(primaryId: string, duplicateId: string): AutoLinkReviewItem {
    if (primaryId === duplicateId) {
      throw new AppError('Primary and duplicate items must be different', 400);
    }

    const primary = this.getAutoLinkReviewItem(primaryId);
    const duplicate = this.getAutoLinkReviewItem(duplicateId);

    if (primary.status === 'merged' || duplicate.status === 'merged') {
      throw new AppError('Merged items cannot be merged again', 400);
    }

    const mergedDuplicate: AutoLinkReviewItem = {
      ...duplicate,
      status: 'merged',
      mergedIntoId: primary.id,
      updatedAt: new Date(),
    };
    this.autoLinkReviewItems.set(duplicateId, mergedDuplicate);

    return mergedDuplicate;
  }

  createTopicFromSuggestion(reviewItemId: string, subjectId: string, name?: string): Topic {
    this.getSubject(subjectId);
    const reviewItem = this.getAutoLinkReviewItem(reviewItemId);
    const fallbackName = this.suggestNewTopicName(reviewItem.text);
    const topicName = name ?? reviewItem.topicSuggestion.newTopicSuggestion ?? fallbackName;
    return this.createTopic({
      subjectId,
      name: topicName,
    });
  }

  private getContentNode(id: string): ContentNode {
    const contentNode = this.contentNodes.get(id);

    if (!contentNode) {
      throw new AppError('Content node not found', 404);
    }

    return contentNode;
  }

  private createAutoLinkReviewItem(type: ExtractedContentType, text: string): AutoLinkReviewItem {
    const match = this.matchTopic(text);
    const now = new Date();
    const item: AutoLinkReviewItem = {
      id: randomUUID(),
      type,
      text,
      topicSuggestion: {
        topicId: match.topicId,
        confidence: match.confidence,
        method: match.method,
        newTopicSuggestion: match.newTopicSuggestion,
      },
      status: 'pending',
      linkedTopicId: null,
      editedText: null,
      smartHighlights: this.generateSmartHighlights(text),
      microNote: type === 'concept' ? this.generateMicroNote(text) : null,
      difficulty: type === 'mcq' ? this.tagMcqDifficulty(text) : null,
      mergedIntoId: null,
      createdAt: now,
      updatedAt: now,
    };

    this.autoLinkReviewItems.set(item.id, item);
    return item;
  }

  private matchTopic(
    text: string,
  ): { topicId: string | null; confidence: number; method: TopicMatchMethod; newTopicSuggestion: string | null } {
    const topics = this.listAllTopics();

    if (topics.length === 0) {
      return {
        topicId: null,
        confidence: 0,
        method: 'keyword',
        newTopicSuggestion: this.suggestNewTopicName(text),
      };
    }

    let best: { topicId: string | null; confidence: number; method: TopicMatchMethod } = {
      topicId: null,
      confidence: 0,
      method: 'keyword',
    };

    topics.forEach((topic) => {
      const topicText = `${topic.name} ${topic.description ?? ''}`;
      const keywordScore = this.keywordSimilarity(text, topicText);
      const semanticScore = this.semanticSimilarity(text, topicText);
      const llmScore = this.llmStyleClassificationScore(text, topicText);
      const candidateScores: Array<{ score: number; method: TopicMatchMethod }> = [
        { score: keywordScore, method: 'keyword' },
        { score: semanticScore, method: 'semantic' },
        { score: llmScore, method: 'llm' },
      ];
      const bestCandidate = candidateScores.sort((a, b) => b.score - a.score)[0];

      if (bestCandidate && bestCandidate.score > best.confidence) {
        best = {
          topicId: topic.id,
          confidence: Number(bestCandidate.score.toFixed(2)),
          method: bestCandidate.method,
        };
      }
    });

    if (best.confidence < TOPIC_MATCH_CONFIDENCE_THRESHOLD) {
      return {
        topicId: null,
        confidence: best.confidence,
        method: best.method,
        newTopicSuggestion: this.suggestNewTopicName(text),
      };
    }

    return {
      topicId: best.topicId,
      confidence: best.confidence,
      method: best.method,
      newTopicSuggestion: null,
    };
  }

  private tokenize(value: string): string[] {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > MIN_TOKEN_LENGTH && !STOP_WORDS.has(token));
  }

  private keywordSimilarity(left: string, right: string): number {
    const leftTokens = new Set(this.tokenize(left));
    const rightTokens = new Set(this.tokenize(right));
    if (leftTokens.size === 0 || rightTokens.size === 0) {
      return 0;
    }

    const overlapCount = [...leftTokens].filter((token) => rightTokens.has(token)).length;
    return overlapCount / Math.max(leftTokens.size, rightTokens.size);
  }

  private semanticSimilarity(left: string, right: string): number {
    const leftTokens = this.tokenize(left);
    const rightTokens = this.tokenize(right);
    if (leftTokens.length === 0 || rightTokens.length === 0) {
      return 0;
    }

    const leftCounts = new Map<string, number>();
    const rightCounts = new Map<string, number>();
    leftTokens.forEach((token) => leftCounts.set(token, (leftCounts.get(token) ?? 0) + 1));
    rightTokens.forEach((token) => rightCounts.set(token, (rightCounts.get(token) ?? 0) + 1));

    const terms = new Set([...leftCounts.keys(), ...rightCounts.keys()]);
    let dot = 0;
    let leftMagnitude = 0;
    let rightMagnitude = 0;

    terms.forEach((term) => {
      const leftValue = leftCounts.get(term) ?? 0;
      const rightValue = rightCounts.get(term) ?? 0;
      dot += leftValue * rightValue;
      leftMagnitude += leftValue * leftValue;
      rightMagnitude += rightValue * rightValue;
    });

    if (leftMagnitude === 0 || rightMagnitude === 0) {
      return 0;
    }

    return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
  }

  private llmStyleClassificationScore(content: string, topicText: string): number {
    const loweredContent = content.toLowerCase();
    const loweredTopic = topicText.toLowerCase();
    const topicFirstToken = loweredTopic.trim().split(/\s+/)[0];
    const phraseBoost = topicFirstToken && loweredContent.includes(topicFirstToken) ? LLM_PHRASE_BOOST : 0;
    return Math.min(
      1,
      this.keywordSimilarity(content, topicText) * LLM_KEYWORD_WEIGHT +
        this.semanticSimilarity(content, topicText) * LLM_SEMANTIC_WEIGHT +
        phraseBoost,
    );
  }

  private suggestNewTopicName(text: string): string {
    const tokens = this.tokenize(text).slice(0, 3);
    if (tokens.length === 0) {
      return 'New Topic';
    }
    return tokens.map((token) => token.charAt(0).toUpperCase() + token.slice(1)).join(' ');
  }

  private generateSmartHighlights(text: string): string[] {
    return text
      .split(/[.!?]\s+/)
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > MIN_HIGHLIGHT_LENGTH)
      .slice(0, MAX_HIGHLIGHTS);
  }

  private generateMicroNote(text: string): string {
    const tokens = text.trim().split(/\s+/).filter((token) => token.length > 0);
    const words = tokens.slice(0, MAX_MICRO_NOTE_WORDS).join(' ');
    return words.length > 0 ? `${words}${tokens.length > MAX_MICRO_NOTE_WORDS ? '…' : ''}` : 'Quick concept recap';
  }

  private tagMcqDifficulty(text: string): 'easy' | 'medium' | 'hard' {
    const length = text.split(/\s+/).length;
    if (length <= EASY_DIFFICULTY_THRESHOLD) {
      return 'easy';
    }
    if (length <= MEDIUM_DIFFICULTY_THRESHOLD) {
      return 'medium';
    }
    return 'hard';
  }

  private getAutoLinkReviewItem(id: string): AutoLinkReviewItem {
    const item = this.autoLinkReviewItems.get(id);
    if (!item) {
      throw new AppError('Auto-link review item not found', 404);
    }
    return item;
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

    // Full UPSC Civil Services syllabus data
    // Structure: { paper, subjects: [{ name, description, topics: [{ name, subtopics: [string] }] }] }
    const syllabus: Array<{
      paper: string;
      paperLabel: string;
      subjects: Array<{
        name: string;
        description: string;
        topics: Array<{ name: string; subtopics: string[] }>;
      }>;
    }> = [
      // ── PRELIMS GS1 ──
      {
        paper: 'PRE_GS1',
        paperLabel: 'Prelims - General Studies I',
        subjects: [
          {
            name: 'History',
            description: 'Indian History from ancient to modern period',
            topics: [
              {
                name: 'Ancient India',
                subtopics: [
                  'Prehistoric cultures & Indus Valley Civilisation',
                  'Vedic Age & Mahajanapadas',
                  'Mauryan Empire & post-Mauryan polities',
                  'Gupta Empire & regional kingdoms',
                  'Art, architecture & literature of ancient India',
                ],
              },
              {
                name: 'Medieval India',
                subtopics: [
                  'Delhi Sultanate',
                  'Mughal Empire',
                  'Bhakti & Sufi movements',
                  'Vijayanagara & other regional kingdoms',
                  'Society, economy & culture in medieval India',
                ],
              },
              {
                name: 'Modern India',
                subtopics: [
                  'European penetration & British conquest',
                  'Socio-religious reform movements',
                  'Revolt of 1857 & aftermath',
                  'Indian National Movement phases',
                  'Post-1947 consolidation & integration',
                ],
              },
            ],
          },
          {
            name: 'Geography',
            description: 'Physical, Indian & world geography',
            topics: [
              {
                name: 'Physical Geography',
                subtopics: [
                  'Geomorphology & landforms',
                  'Climatology & atmospheric circulation',
                  'Oceanography',
                  'Biogeography & soils',
                ],
              },
              {
                name: 'Indian Geography',
                subtopics: [
                  'Physiographic divisions',
                  'Drainage systems & river basins',
                  'Monsoon mechanism & climate regions',
                  'Natural resources & mineral distribution',
                  'Population distribution & urbanisation',
                ],
              },
              {
                name: 'World Geography',
                subtopics: [
                  'Continents & major physical features',
                  'Global climate patterns',
                  'Resource distribution worldwide',
                ],
              },
            ],
          },
          {
            name: 'Polity',
            description: 'Indian Polity & governance',
            topics: [
              {
                name: 'Constitutional Framework',
                subtopics: [
                  'Historical background & making of Constitution',
                  'Preamble & salient features',
                  'Fundamental Rights & Duties',
                  'Directive Principles of State Policy',
                  'Amendment process & basic structure doctrine',
                ],
              },
              {
                name: 'Union & State Government',
                subtopics: [
                  'Parliament: composition, powers & privileges',
                  'President & Vice-President',
                  'Prime Minister & Council of Ministers',
                  'State legislature & Governor',
                  'Centre-State relations',
                ],
              },
              {
                name: 'Judiciary',
                subtopics: [
                  'Supreme Court & High Courts',
                  'Judicial review & PIL',
                  'Tribunals & quasi-judicial bodies',
                ],
              },
              {
                name: 'Local Governance',
                subtopics: [
                  'Panchayati Raj (73rd Amendment)',
                  'Municipalities (74th Amendment)',
                  'Scheduled & Tribal Areas',
                ],
              },
            ],
          },
          {
            name: 'Economy',
            description: 'Indian Economy & economic development',
            topics: [
              {
                name: 'Macroeconomics & Planning',
                subtopics: [
                  'National income accounting',
                  'Planning Commission to NITI Aayog',
                  'Fiscal policy & budgeting',
                  'Monetary policy & RBI functions',
                ],
              },
              {
                name: 'Sectors of Indian Economy',
                subtopics: [
                  'Agriculture & food management',
                  'Industry & manufacturing policy',
                  'Services sector & IT',
                  'Infrastructure: energy, transport, telecom',
                ],
              },
              {
                name: 'External Sector',
                subtopics: [
                  'Balance of Payments & trade policy',
                  'WTO & international economic bodies',
                  'Foreign investment & exchange reserves',
                ],
              },
            ],
          },
          {
            name: 'Environment & Ecology',
            description: 'Environment, ecology, biodiversity & climate change',
            topics: [
              {
                name: 'Ecology Fundamentals',
                subtopics: [
                  'Ecosystems & food chains',
                  'Biodiversity: types, threats & conservation',
                  'Biomes & biogeochemical cycles',
                ],
              },
              {
                name: 'Environmental Issues',
                subtopics: [
                  'Pollution: air, water, soil, noise',
                  'Climate change & global warming',
                  'Waste management & circular economy',
                ],
              },
              {
                name: 'Environmental Governance',
                subtopics: [
                  'Environmental laws & policies in India',
                  'International agreements (Paris, CBD, Ramsar)',
                  'Protected areas & wildlife conservation',
                ],
              },
            ],
          },
          {
            name: 'Science & Technology',
            description: 'General science, technology & space',
            topics: [
              {
                name: 'Basic Sciences',
                subtopics: [
                  'Physics in everyday life',
                  'Chemistry in everyday life',
                  'Biology & human health',
                ],
              },
              {
                name: 'Technology & Innovation',
                subtopics: [
                  'IT, computers & cyber security',
                  'Space technology & ISRO missions',
                  'Defence technology & indigenisation',
                  'Nuclear technology',
                ],
              },
              {
                name: 'Emerging Technologies',
                subtopics: [
                  'Artificial intelligence & machine learning',
                  'Biotechnology & genetic engineering',
                  'Nanotechnology & robotics',
                ],
              },
            ],
          },
          {
            name: 'Current Affairs',
            description: 'National & international current events',
            topics: [
              {
                name: 'National Events',
                subtopics: [
                  'Government schemes & policies',
                  'Awards & appointments',
                  'Important legislation',
                ],
              },
              {
                name: 'International Events',
                subtopics: [
                  'Summits & conferences',
                  'Global conflicts & geopolitics',
                  'International organisations',
                ],
              },
            ],
          },
        ],
      },

      // ── PRELIMS GS2 (CSAT) ──
      {
        paper: 'PRE_GS2',
        paperLabel: 'Prelims - CSAT (Paper II)',
        subjects: [
          {
            name: 'Aptitude & Reasoning',
            description: 'Comprehension, logical reasoning, analytical ability, decision-making & basic numeracy',
            topics: [
              {
                name: 'Reading Comprehension',
                subtopics: [
                  'Passage-based questions',
                  'Inference & critical reasoning from passages',
                ],
              },
              {
                name: 'Logical Reasoning',
                subtopics: [
                  'Deductive & inductive reasoning',
                  'Syllogisms & logical connectives',
                  'Coding-decoding & series',
                  'Blood relations & direction sense',
                  'Venn diagrams & arrangements',
                ],
              },
              {
                name: 'Analytical Ability',
                subtopics: [
                  'Data interpretation (tables, graphs, charts)',
                  'Data sufficiency',
                  'Pattern recognition',
                ],
              },
              {
                name: 'Decision Making & Problem Solving',
                subtopics: [
                  'Administrative decision making',
                  'Situational judgement',
                ],
              },
              {
                name: 'Basic Numeracy & Data Handling',
                subtopics: [
                  'Number systems & simplification',
                  'Percentage, ratio & proportion',
                  'Time, speed, distance & work',
                  'Probability & statistics basics',
                ],
              },
            ],
          },
        ],
      },

      // ── MAINS ESSAY ──
      {
        paper: 'MAINS_ESSAY',
        paperLabel: 'Mains - Essay (Paper I)',
        subjects: [
          {
            name: 'Essay Writing',
            description: 'Two essays on topics of national/international relevance',
            topics: [
              {
                name: 'Philosophical & Abstract',
                subtopics: [
                  'Value-based & ethical themes',
                  'Quotes & proverbs analysis',
                ],
              },
              {
                name: 'Socio-Economic',
                subtopics: [
                  'Poverty, inequality & development',
                  'Education & social empowerment',
                  'Urbanisation & rural issues',
                ],
              },
              {
                name: 'Political & Governance',
                subtopics: [
                  'Democracy, governance & policy',
                  'Federalism & decentralisation',
                ],
              },
              {
                name: 'Science, Technology & Environment',
                subtopics: [
                  'Technology and society',
                  'Climate change & sustainability',
                ],
              },
              {
                name: 'International & Strategic',
                subtopics: [
                  'India & the global order',
                  'Geopolitical & security themes',
                ],
              },
            ],
          },
        ],
      },

      // ── MAINS GS1 ──
      {
        paper: 'MAINS_GS1',
        paperLabel: 'Mains - General Studies I',
        subjects: [
          {
            name: 'Indian Heritage & Culture',
            description: 'Art, architecture, literature & cultural history',
            topics: [
              {
                name: 'Art & Architecture',
                subtopics: [
                  'Temple architecture styles (Nagara, Dravida, Vesara)',
                  'Buddhist, Jain & Islamic architecture',
                  'Paintings: miniature, mural, folk traditions',
                  'Sculpture traditions across periods',
                ],
              },
              {
                name: 'Literature & Philosophy',
                subtopics: [
                  'Vedic & classical Sanskrit literature',
                  'Regional languages & literary movements',
                  'Indian philosophical schools',
                ],
              },
              {
                name: 'Performing Arts & Traditions',
                subtopics: [
                  'Classical dance forms',
                  'Classical & folk music traditions',
                  'Theatre & puppetry',
                  'Festivals & fairs',
                ],
              },
            ],
          },
          {
            name: 'Modern Indian History',
            description: 'From mid-18th century to present: freedom struggle, reform & consolidation',
            topics: [
              {
                name: 'British Rule & Resistance',
                subtopics: [
                  'East India Company to Crown rule',
                  'Revenue & administrative reforms',
                  'Tribal & peasant movements',
                  'Revolt of 1857',
                ],
              },
              {
                name: 'Freedom Movement',
                subtopics: [
                  'Moderate & Extremist phases',
                  'Gandhian movements (NCM, CDM, QIM)',
                  'Revolutionary movements',
                  'Role of women & marginalised groups',
                  'Towards partition & independence',
                ],
              },
            ],
          },
          {
            name: 'Post-Independence India',
            description: 'Consolidation & reorganisation of India after 1947',
            topics: [
              {
                name: 'Integration & State Reorganisation',
                subtopics: [
                  'Princely states integration',
                  'States Reorganisation Commission & linguistic states',
                ],
              },
              {
                name: 'Political & Economic Development',
                subtopics: [
                  'Nehruvian era & five-year plans',
                  'Green Revolution & industrial policy',
                  'Liberalisation & reforms (1991 onwards)',
                ],
              },
            ],
          },
          {
            name: 'World History',
            description: '18th century world events to present',
            topics: [
              {
                name: 'Revolutions & Wars',
                subtopics: [
                  'French Revolution & Napoleonic era',
                  'American Revolution & Civil War',
                  'World War I & its aftermath',
                  'World War II & UN formation',
                ],
              },
              {
                name: 'Colonialism & Decolonisation',
                subtopics: [
                  'Imperialism in Asia & Africa',
                  'Decolonisation movements',
                  'Cold War & bipolar world',
                ],
              },
              {
                name: 'Political Ideologies',
                subtopics: [
                  'Communism, capitalism & socialism',
                  'Nationalism & self-determination',
                ],
              },
            ],
          },
          {
            name: 'Indian Society',
            description: 'Social structure, diversity, issues & globalisation',
            topics: [
              {
                name: 'Social Structure & Diversity',
                subtopics: [
                  'Caste system & its transformations',
                  'Tribal communities & their issues',
                  'Regional, linguistic & religious diversity',
                ],
              },
              {
                name: 'Social Issues',
                subtopics: [
                  'Women & gender issues',
                  'Population & demographic trends',
                  'Urbanisation challenges',
                  'Communalism, regionalism & secularism',
                ],
              },
              {
                name: 'Globalisation & Society',
                subtopics: [
                  'Effects on Indian culture & society',
                  'Role of civil society & NGOs',
                ],
              },
            ],
          },
          {
            name: 'Geography',
            description: 'Physical geography and resource distribution for Mains GS1',
            topics: [
              {
                name: 'Physical Geography',
                subtopics: [
                  'Geomorphology & weathering',
                  'Climatology & global pressure belts',
                  'Oceanography: currents, tides, salinity',
                ],
              },
              {
                name: 'Human & Economic Geography',
                subtopics: [
                  'Population & settlement geography',
                  'Migration patterns & urbanisation',
                  'Resource distribution worldwide',
                ],
              },
              {
                name: 'Geographical Phenomena',
                subtopics: [
                  'Earthquakes, volcanoes & tsunamis',
                  'Cyclones & floods',
                ],
              },
            ],
          },
        ],
      },

      // ── MAINS GS2 ──
      {
        paper: 'MAINS_GS2',
        paperLabel: 'Mains - General Studies II',
        subjects: [
          {
            name: 'Polity & Constitution',
            description: 'Indian Constitution, governance, political system',
            topics: [
              {
                name: 'Constitutional Design',
                subtopics: [
                  'Federalism & Centre-State relations',
                  'Separation of powers & checks',
                  'Constitutional amendments & landmark judgements',
                  'Comparison with other constitutions',
                ],
              },
              {
                name: 'Parliament & State Legislatures',
                subtopics: [
                  'Parliamentary procedures & committees',
                  'Legislative process & delegated legislation',
                  'Anti-defection law & parliamentary reforms',
                ],
              },
              {
                name: 'Executive & Judiciary',
                subtopics: [
                  'Executive accountability & ministerial responsibility',
                  'Judicial activism & judicial overreach',
                  'Appointment & transfer of judges',
                  'Dispute redressal mechanisms',
                ],
              },
              {
                name: 'Elections & Representation',
                subtopics: [
                  'Election Commission & electoral reforms',
                  'Representation of People Act',
                  'Political parties & pressure groups',
                ],
              },
            ],
          },
          {
            name: 'Governance',
            description: 'Government policies, transparency, e-governance & accountability',
            topics: [
              {
                name: 'Government Policies & Interventions',
                subtopics: [
                  'Design & implementation of welfare schemes',
                  'Role of NGOs & SHGs',
                  'Citizens charters & service delivery',
                ],
              },
              {
                name: 'Transparency & Accountability',
                subtopics: [
                  'RTI Act & its impact',
                  'Lokpal & Lokayuktas',
                  'CVC, CBI & anti-corruption mechanisms',
                ],
              },
              {
                name: 'E-Governance',
                subtopics: [
                  'Digital India & e-governance initiatives',
                  'Challenges of e-governance implementation',
                ],
              },
            ],
          },
          {
            name: 'Social Justice',
            description: 'Welfare, health, education & vulnerable sections',
            topics: [
              {
                name: 'Welfare Schemes & Institutions',
                subtopics: [
                  'Schemes for SC/ST/OBC/minorities/women',
                  'Labour laws & social security',
                  'Issues relating to poverty & hunger',
                ],
              },
              {
                name: 'Health & Education',
                subtopics: [
                  'Healthcare policies & public health',
                  'Education policy (NEP) & reforms',
                  'Issues of access & quality',
                ],
              },
              {
                name: 'Vulnerable Sections',
                subtopics: [
                  'Children & child labour',
                  'Elderly, disabled & transgender rights',
                  'Tribal welfare & displacement issues',
                ],
              },
            ],
          },
          {
            name: 'International Relations',
            description: 'India and its neighbourhood, bilateral & multilateral relations',
            topics: [
              {
                name: 'India & Neighbourhood',
                subtopics: [
                  'India-Pakistan relations',
                  'India-China relations',
                  'Relations with SAARC & BIMSTEC nations',
                  'India-Sri Lanka & India-Bangladesh',
                ],
              },
              {
                name: 'Bilateral & Global Relations',
                subtopics: [
                  'India-USA relations',
                  'India-Russia & India-EU',
                  'India-Africa & India-ASEAN',
                  'Act East & Look West policies',
                ],
              },
              {
                name: 'International Organisations',
                subtopics: [
                  'UN system & reform',
                  'WTO, IMF, World Bank',
                  'Regional groupings (BRICS, SCO, G20, Quad)',
                ],
              },
              {
                name: 'Issues in International Relations',
                subtopics: [
                  'Indian diaspora & soft power',
                  'Effect of other countries\u2019 policies on India',
                ],
              },
            ],
          },
        ],
      },

      // ── MAINS GS3 ──
      {
        paper: 'MAINS_GS3',
        paperLabel: 'Mains - General Studies III',
        subjects: [
          {
            name: 'Economic Development',
            description: 'Indian economy, growth, development & related issues',
            topics: [
              {
                name: 'Growth & Development',
                subtopics: [
                  'Inclusive growth & sustainability',
                  'Poverty, unemployment & inequality',
                  'Government budgeting & fiscal policy',
                ],
              },
              {
                name: 'Financial Sector',
                subtopics: [
                  'Banking & financial inclusion',
                  'Capital markets & insurance',
                  'Monetary policy & inflation management',
                ],
              },
              {
                name: 'Industry & Infrastructure',
                subtopics: [
                  'Industrial policy & Make in India',
                  'Investment models & PPP',
                  'Infrastructure development: roads, ports, energy',
                ],
              },
              {
                name: 'External Economics',
                subtopics: [
                  'Liberalisation & globalisation effects',
                  'Trade agreements & exports strategy',
                  'Effects of global economic crises on India',
                ],
              },
            ],
          },
          {
            name: 'Agriculture',
            description: 'Agriculture, food processing & related issues',
            topics: [
              {
                name: 'Agricultural Practices',
                subtopics: [
                  'Cropping patterns & land reforms',
                  'Irrigation & water management',
                  'Farm mechanisation & technology',
                ],
              },
              {
                name: 'Food Security & Supply Chain',
                subtopics: [
                  'MSP, PDS & buffer stocks',
                  'Food processing & value addition',
                  'Supply chain management & e-NAM',
                ],
              },
              {
                name: 'Agricultural Reforms',
                subtopics: [
                  'Farm subsidies & their rationalisation',
                  'Agricultural marketing reforms',
                  'Animal husbandry & allied activities',
                ],
              },
            ],
          },
          {
            name: 'Science & Technology',
            description: 'Developments in S&T and their applications',
            topics: [
              {
                name: 'Indigenisation & Space',
                subtopics: [
                  'Indigenisation of technology & developing new tech',
                  'ISRO missions & space policy',
                  'Defence & strategic technologies',
                ],
              },
              {
                name: 'IT & Emerging Tech',
                subtopics: [
                  'AI, robotics & automation',
                  'Cyber security & data protection',
                  'Blockchain & fintech',
                ],
              },
              {
                name: 'Biotech & Health Tech',
                subtopics: [
                  'Biotechnology applications in agriculture & health',
                  'IPR & technology transfer',
                ],
              },
            ],
          },
          {
            name: 'Environment & Disaster Management',
            description: 'Environmental conservation, pollution & disaster management',
            topics: [
              {
                name: 'Conservation & Biodiversity',
                subtopics: [
                  'Wildlife protection & conservation efforts',
                  'Forest governance & community reserves',
                  'Environmental Impact Assessment',
                ],
              },
              {
                name: 'Pollution & Climate',
                subtopics: [
                  'Air & water pollution control',
                  'Climate change mitigation & adaptation',
                  'Carbon credits & green finance',
                ],
              },
              {
                name: 'Disaster Management',
                subtopics: [
                  'NDMA & SDMA framework',
                  'Disaster preparedness & response',
                  'Flood, drought & earthquake management',
                  'Role of technology in disaster risk reduction',
                ],
              },
            ],
          },
          {
            name: 'Internal Security',
            description: 'Security challenges, border management, extremism & cyber security',
            topics: [
              {
                name: 'Security Threats',
                subtopics: [
                  'Left-wing extremism (Naxalism)',
                  'Terrorism & cross-border threats',
                  'Insurgency in North-East India',
                ],
              },
              {
                name: 'Border & Coastal Security',
                subtopics: [
                  'Border management & fencing',
                  'Coastal security & maritime threats',
                  'Role of BSF, ITBP, Coast Guard',
                ],
              },
              {
                name: 'Organised Crime & Cyber',
                subtopics: [
                  'Money laundering & organised crime',
                  'Cyber warfare & cyber crime',
                  'Linkages between crime & terror',
                ],
              },
              {
                name: 'Security Architecture',
                subtopics: [
                  'Role of media & social media in security',
                  'Security forces & their mandate',
                  'Intelligence agencies & coordination',
                ],
              },
            ],
          },
        ],
      },

      // ── MAINS GS4 ──
      {
        paper: 'MAINS_GS4',
        paperLabel: 'Mains - General Studies IV (Ethics)',
        subjects: [
          {
            name: 'Ethics, Integrity & Aptitude',
            description: 'Ethics & human interface, attitude, aptitude, emotional intelligence, public service values',
            topics: [
              {
                name: 'Ethics & Human Interface',
                subtopics: [
                  'Essence, determinants & consequences of ethics',
                  'Dimensions of ethics: private & public relationships',
                  'Human values: role of family, society & education',
                  'Contributions of moral thinkers (Indian & Western)',
                ],
              },
              {
                name: 'Attitude',
                subtopics: [
                  'Content, structure & function of attitudes',
                  'Influence on thought & behaviour',
                  'Moral & political attitudes',
                  'Persuasion & attitude change',
                ],
              },
              {
                name: 'Aptitude & Emotional Intelligence',
                subtopics: [
                  'Civil service aptitude & foundational values',
                  'Integrity, impartiality & non-partisanship',
                  'Emotional intelligence: concepts & application',
                  'Tolerance, compassion & empathy in governance',
                ],
              },
              {
                name: 'Public Administration Ethics',
                subtopics: [
                  'Ethical concerns in public administration',
                  'Laws, rules & conscience as sources of guidance',
                  'Accountability & ethical governance',
                  'Strengthening ethical & moral values in governance',
                  'Code of conduct & code of ethics',
                ],
              },
              {
                name: 'Probity in Governance',
                subtopics: [
                  'Concept of public service & philosophy',
                  'Information sharing & transparency',
                  'RTI, codes of ethics & citizen charters',
                  'Work culture & quality of service delivery',
                  'Challenges of corruption',
                ],
              },
              {
                name: 'Case Studies',
                subtopics: [
                  'Ethical dilemma scenarios',
                  'Conflict of interest situations',
                  'Administrative ethics case analysis',
                ],
              },
            ],
          },
        ],
      },
    ];

    for (const paper of syllabus) {
      for (const subjectData of paper.subjects) {
        const subject = this.createSubject({
          name: subjectData.name,
          description: subjectData.description,
          paper: paper.paper,
        });

        for (const topicData of subjectData.topics) {
          const topic = this.createTopic({
            subjectId: subject.id,
            name: topicData.name,
            description: `${subjectData.name} — ${topicData.name}`,
          });

          for (const subtopicName of topicData.subtopics) {
            this.createTopic({
              subjectId: subject.id,
              parentTopicId: topic.id,
              name: subtopicName,
              description: `${topicData.name} — ${subtopicName}`,
            });
          }
        }
      }
    }
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
