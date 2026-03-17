import { EmbeddingService, createEmbeddingService } from './embedding.service.js';

export type VectorSearchDocument = {
  id: string;
  topicId: string;
  source: 'content' | 'note';
  type: string;
  title: string | null;
  body: string;
  subject: string;
  topic: string;
};

export type VectorSearchResult = VectorSearchDocument & {
  score: number;
  highlight: string;
};

type HybridSearchOptions = {
  type?: string;
  subject?: string;
  topic?: string;
  limit?: number;
};

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

const toTokens = (value: string): string[] =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);

const cosineSimilarity = (left: number[], right: number[]): number => {
  if (left.length !== right.length || left.length === 0) {
    return 0;
  }

  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let i = 0; i < left.length; i += 1) {
    const l = left[i] ?? 0;
    const r = right[i] ?? 0;
    dot += l * r;
    leftMagnitude += l * l;
    rightMagnitude += r * r;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dot / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
};

const buildHighlight = (query: string, text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) {
    return '';
  }

  const words = toTokens(query);
  const firstMatch = words.find((word) => trimmed.toLowerCase().includes(word));
  if (!firstMatch) {
    return trimmed.length > 220 ? `${trimmed.slice(0, 220)}...` : trimmed;
  }

  const index = trimmed.toLowerCase().indexOf(firstMatch);
  const start = Math.max(0, index - 60);
  const end = Math.min(trimmed.length, index + firstMatch.length + 120);
  const snippet = trimmed.slice(start, end);
  const highlighted = snippet.replace(
    new RegExp(`(${firstMatch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i'),
    '<mark>$1</mark>',
  );
  return `${start > 0 ? '...' : ''}${highlighted}${end < trimmed.length ? '...' : ''}`;
};

export class VectorSearchService {
  private readonly embeddingService: EmbeddingService;

  constructor(embeddingService?: EmbeddingService) {
    this.embeddingService = embeddingService ?? createEmbeddingService();
  }

  hybridSearch(query: string, documents: VectorSearchDocument[], options: HybridSearchOptions = {}): VectorSearchResult[] {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return [];
    }

    const queryEmbedding = this.embeddingService.generateEmbedding(normalizedQuery);
    const queryTokens = toTokens(normalizedQuery);
    const filtered = documents.filter((document) => {
      if (options.type && options.type !== document.type) {
        return false;
      }
      if (options.subject && options.subject.toLowerCase() !== document.subject.toLowerCase()) {
        return false;
      }
      if (options.topic && options.topic.toLowerCase() !== document.topic.toLowerCase()) {
        return false;
      }
      return true;
    });

    const ranked = filtered
      .map((document) => {
        const searchableText = `${document.title ?? ''} ${document.body}`.trim();
        const documentEmbedding = this.embeddingService.generateEmbedding(searchableText);
        const vectorScore = clamp(cosineSimilarity(queryEmbedding, documentEmbedding));
        const lowerText = searchableText.toLowerCase();
        const keywordHits = queryTokens.filter((token) => lowerText.includes(token)).length;
        const keywordScore = queryTokens.length === 0 ? 0 : clamp(keywordHits / queryTokens.length);
        const rerankBoost =
          document.title && queryTokens.some((token) => document.title!.toLowerCase().includes(token)) ? 0.05 : 0;
        const score = clamp(vectorScore * 0.65 + keywordScore * 0.35 + rerankBoost);

        return {
          ...document,
          score: Number(score.toFixed(4)),
          highlight: buildHighlight(normalizedQuery, searchableText),
        };
      })
      .filter((document) => document.score > 0)
      .sort((left, right) => right.score - left.score);

    const limit = options.limit ?? 20;
    return ranked.slice(0, limit);
  }
}
