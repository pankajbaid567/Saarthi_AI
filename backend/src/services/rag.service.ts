import { VectorSearchService, type VectorSearchDocument } from './vector-search.service.js';

type RagSource = {
  id: string;
  source: 'content' | 'note';
  type: string;
  title: string | null;
  topic: string;
  subject: string;
  score: number;
  excerpt: string;
};

type RagContext = {
  understanding: {
    intent: 'quiz' | 'search' | 'revise' | 'explain';
    entities: string[];
  };
  contextText: string;
  tokenBudget: number;
  usedTokens: number;
  sources: RagSource[];
};

const estimateTokens = (value: string): number => value.split(/\s+/).filter(Boolean).length;

const parseIntent = (query: string): 'quiz' | 'search' | 'revise' | 'explain' => {
  const value = query.toLowerCase();
  if (/(quiz|mcq|question)/.test(value)) {
    return 'quiz';
  }
  if (/(search|find|lookup)/.test(value)) {
    return 'search';
  }
  if (/(revise|revision|summary)/.test(value)) {
    return 'revise';
  }
  return 'explain';
};

const parseEntities = (query: string): string[] => {
  const quoted = [...query.matchAll(/"([^"]+)"/g)].map((match) => match[1]?.trim() ?? '').filter(Boolean);
  const words = query
    .split(/\s+/)
    .map((part) => part.replace(/[^a-z0-9-]/gi, ''))
    .filter((part) => part.length > 3);

  return [...new Set([...quoted, ...words])].slice(0, 8);
};

export class RagService {
  constructor(private readonly vectorSearchService: VectorSearchService) {}

  assembleContext(query: string, documents: VectorSearchDocument[], tokenBudget = 180): RagContext {
    const ranked = this.vectorSearchService.hybridSearch(query, documents, { limit: 15 });
    const understanding = {
      intent: parseIntent(query),
      entities: parseEntities(query),
    };

    const sources: RagSource[] = [];
    let usedTokens = 0;

    for (const result of ranked) {
      const nextTokens = estimateTokens(result.highlight);
      if (usedTokens + nextTokens > tokenBudget && sources.length > 0) {
        break;
      }

      usedTokens += nextTokens;
      sources.push({
        id: result.id,
        source: result.source,
        type: result.type,
        title: result.title,
        topic: result.topic,
        subject: result.subject,
        score: result.score,
        excerpt: result.highlight,
      });
    }

    const contextText = sources
      .map(
        (source, index) =>
          `[${index + 1}] (${source.subject} > ${source.topic} · ${source.type}) ${source.title ?? 'Untitled'}: ${source.excerpt}`,
      )
      .join('\n');

    return {
      understanding,
      contextText,
      tokenBudget,
      usedTokens,
      sources,
    };
  }
}
