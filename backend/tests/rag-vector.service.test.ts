import { describe, expect, it } from 'vitest';

import { EmbeddingService } from '../src/services/embedding.service.js';
import { RagService } from '../src/services/rag.service.js';
import { VectorSearchService } from '../src/services/vector-search.service.js';

describe('rag and vector search services', () => {
  it('runs hybrid semantic search and assembles bounded rag context with source attribution', () => {
    const embeddingService = new EmbeddingService();
    const vectorSearchService = new VectorSearchService(embeddingService);
    const ragService = new RagService(vectorSearchService);

    const documents = [
      {
        id: 'doc-1',
        topicId: 'topic-1',
        source: 'content' as const,
        type: 'concept',
        title: 'Fundamental Rights',
        body: 'Article 14 guarantees equality before law and equal protection.',
        subject: 'Polity',
        topic: 'Fundamental Rights',
      },
      {
        id: 'doc-2',
        topicId: 'topic-2',
        source: 'note' as const,
        type: 'note',
        title: 'Directive Principles',
        body: 'DPSP guide policy but are non-justiciable principles.',
        subject: 'Polity',
        topic: 'Directive Principles',
      },
    ];

    const ranked = vectorSearchService.hybridSearch('equality before law article', documents, { subject: 'Polity' });
    expect(ranked[0]?.id).toBe('doc-1');
    expect(ranked[0]?.highlight).toContain('<mark>');

    const rag = ragService.assembleContext('search article 14 equality', documents, 40);
    expect(rag.understanding.intent).toBe('search');
    expect(rag.usedTokens).toBeLessThanOrEqual(40);
    expect(rag.sources.length).toBeGreaterThan(0);
    expect(rag.contextText).toContain('[1]');
  });
});
