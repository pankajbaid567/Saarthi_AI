import { AppError } from '../errors/app-error.js';

type CurrentAffair = {
  id: string;
  title: string;
  summary: string;
  content: string;
  source: string;
  publishedAt: Date;
  topicId: string;
  topicName: string;
  linkedMcqs: Array<{ id: string; question: string }>;
  linkedMains: Array<{ id: string; question: string }>;
};

type CurrentAffairsFilters = {
  month?: number;
  year?: number;
  topicId?: string;
  page?: number;
  pageSize?: number;
};

type CurrentAffairsServiceOptions = {
  articles?: CurrentAffair[];
};

export class CurrentAffairsService {
  private readonly articles: CurrentAffair[];

  constructor(options: CurrentAffairsServiceOptions = {}) {
    this.articles = options.articles ?? this.buildDefaultArticles();
  }

  list(filters: CurrentAffairsFilters = {}) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(50, filters.pageSize ?? 10));

    const filtered = this.articles.filter((article) => {
      if (filters.topicId && article.topicId !== filters.topicId) {
        return false;
      }

      if (filters.month && article.publishedAt.getUTCMonth() + 1 !== filters.month) {
        return false;
      }

      if (filters.year && article.publishedAt.getUTCFullYear() !== filters.year) {
        return false;
      }

      return true;
    });

    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return {
      data: paginated.map((article) => ({
        id: article.id,
        title: article.title,
        summary: article.summary,
        source: article.source,
        publishedAt: article.publishedAt.toISOString(),
        topicId: article.topicId,
        topicName: article.topicName,
      })),
      pagination: {
        page,
        pageSize,
        total: filtered.length,
      },
    };
  }

  getMonthly(month: number, year: number) {
    const monthly = this.list({ month, year, page: 1, pageSize: 100 });
    return {
      month,
      year,
      totalArticles: monthly.pagination.total,
      articles: monthly.data,
    };
  }

  getById(id: string) {
    const article = this.articles.find((item) => item.id === id);
    if (!article) {
      throw new AppError('Current affairs article not found', 404);
    }

    return {
      id: article.id,
      title: article.title,
      summary: article.summary,
      content: article.content,
      source: article.source,
      publishedAt: article.publishedAt.toISOString(),
      topicId: article.topicId,
      topicName: article.topicName,
      linkedMcqs: article.linkedMcqs,
      linkedMains: article.linkedMains,
    };
  }

  private buildDefaultArticles(): CurrentAffair[] {
    return [
      {
        id: '71111111-1111-4111-8111-111111111111',
        title: 'Supreme Court reiterates limits of delegated legislation',
        summary: 'A recent judgement clarified parliamentary oversight expectations.',
        content:
          'The judgement emphasises that delegated legislation should stay within enabling Act boundaries and strengthens committee scrutiny.',
        source: 'PIB Digest',
        publishedAt: new Date('2026-03-01T00:00:00.000Z'),
        topicId: '21111111-1111-4111-8111-111111111111',
        topicName: 'Fundamental Rights',
        linkedMcqs: [{ id: 'mcq-1', question: 'Which article is most associated with delegated legislation checks?' }],
        linkedMains: [{ id: 'mains-1', question: 'Discuss delegated legislation and constitutional safeguards.' }],
      },
      {
        id: '81111111-1111-4111-8111-111111111111',
        title: 'RBI highlights external sector resilience in monetary report',
        summary: 'The report discussed BoP trends and FX reserve composition.',
        content:
          'The latest report notes resilient external financing, moderated CAD pressure and diversified reserve holdings.',
        source: 'RBI Bulletin',
        publishedAt: new Date('2026-03-05T00:00:00.000Z'),
        topicId: '51111111-1111-4111-8111-111111111111',
        topicName: 'External Sector',
        linkedMcqs: [{ id: 'mcq-2', question: 'Which component directly affects current account deficit?' }],
        linkedMains: [{ id: 'mains-2', question: 'Evaluate India’s external sector stability in recent years.' }],
      },
    ];
  }
}

export const createCurrentAffairsService = (options: CurrentAffairsServiceOptions = {}) =>
  new CurrentAffairsService(options);
