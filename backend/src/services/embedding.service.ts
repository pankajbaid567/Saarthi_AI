import type { ContentNode } from './knowledge-graph.service.js';

const EMBEDDING_DIMENSION = 16;

const tokenize = (value: string): string[] =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);

const normalize = (vector: number[]): number[] => {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) {
    return vector;
  }

  return vector.map((value) => value / magnitude);
};

const buildSignature = (node: Pick<ContentNode, 'id' | 'title' | 'body' | 'updatedAt'>): string =>
  `${node.id}:${node.title ?? ''}:${node.body}:${node.updatedAt.toISOString()}`;

export class EmbeddingService {
  private readonly contentEmbeddings = new Map<string, { signature: string; vector: number[] }>();

  generateEmbedding(text: string): number[] {
    const vector = new Array<number>(EMBEDDING_DIMENSION).fill(0);
    const tokens = tokenize(text);

    tokens.forEach((token, tokenIndex) => {
      for (let charIndex = 0; charIndex < token.length; charIndex += 1) {
        const code = token.charCodeAt(charIndex);
        const index = (code + tokenIndex + charIndex) % EMBEDDING_DIMENSION;
        vector[index] += (code % 31) / 31;
      }
    });

    return normalize(vector);
  }

  generateEmbeddingsForAllContent(nodes: ContentNode[]): void {
    nodes.forEach((node) => {
      this.getEmbeddingForContent(node);
    });
  }

  getEmbeddingForContent(node: ContentNode): number[] {
    const signature = buildSignature(node);
    const existing = this.contentEmbeddings.get(node.id);
    if (existing && existing.signature === signature) {
      return existing.vector;
    }

    const vector = this.generateEmbedding(`${node.title ?? ''} ${node.body}`.trim());
    this.contentEmbeddings.set(node.id, { signature, vector });
    return vector;
  }
}

const defaultEmbeddingService = new EmbeddingService();

export const createEmbeddingService = (): EmbeddingService => defaultEmbeddingService;
