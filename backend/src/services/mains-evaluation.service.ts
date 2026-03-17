import { randomUUID } from 'crypto';

import { AppError } from '../errors/app-error.js';
import { createKnowledgeGraphService, type KnowledgeGraphService } from './knowledge-graph.service.js';

type MainsQuestionType = 'pyq' | 'coaching' | 'ai_generated';

type RubricDimension = {
  name: string;
  expectedSignals: string[];
};

type MainsQuestion = {
  id: string;
  topicId: string;
  topicName: string;
  questionText: string;
  marks: number;
  wordLimit: number;
  type: MainsQuestionType;
  year?: number;
  modelAnswer: string;
  topperAnswer: string;
  evaluationRubric: {
    keywords: string[];
    dimensions: RubricDimension[];
  };
};

type EvaluationBreakdown = {
  structure: {
    score: number;
    maxScore: number;
    feedback: string;
  };
  content: {
    score: number;
    maxScore: number;
    feedback: string;
    missingPoints: string[];
  };
  keywords: {
    score: number;
    maxScore: number;
    present: string[];
    missing: string[];
  };
  presentation: {
    score: number;
    maxScore: number;
    feedback: string;
  };
};

type MainsSubmission = {
  id: string;
  userId: string;
  questionId: string;
  topicId: string;
  answerText: string;
  wordCount: number;
  overallScore: number;
  maxScore: number;
  breakdown: EvaluationBreakdown;
  improvements: string[];
  highlightedGaps: string[];
  modelAnswer: string;
  topperAnswer: string;
  createdAt: Date;
};

type ListQuestionsFilter = {
  topicId?: string;
  type?: MainsQuestionType;
  marks?: number;
  page?: number;
  limit?: number;
};

type ListSubmissionsFilter = {
  topicId?: string;
  questionId?: string;
  page?: number;
  limit?: number;
};

const roundToTwoDecimals = (value: number): number => Number(value.toFixed(2));

const countWords = (value: string): number => {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
};

const normalize = (value: string): string => value.trim().toLowerCase();

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const unique = (items: string[]): string[] => [...new Set(items)];

export class MainsEvaluationService {
  private readonly knowledgeGraphService: KnowledgeGraphService;

  private readonly questionsById = new Map<string, MainsQuestion>();

  private readonly submissionsById = new Map<string, MainsSubmission>();

  constructor(knowledgeGraphService?: KnowledgeGraphService) {
    this.knowledgeGraphService = knowledgeGraphService ?? createKnowledgeGraphService();
    this.seedQuestions();
  }

  listQuestions(filter: ListQuestionsFilter = {}) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 10;

    const filtered = [...this.questionsById.values()]
      .filter((question) => (filter.topicId ? question.topicId === filter.topicId : true))
      .filter((question) => (filter.type ? question.type === filter.type : true))
      .filter((question) => (filter.marks ? question.marks === filter.marks : true));

    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      items: filtered.slice(start, end),
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      },
    };
  }

  getQuestion(questionId: string): MainsQuestion {
    const question = this.questionsById.get(questionId);
    if (!question) {
      throw new AppError('Mains question not found', 404);
    }

    return question;
  }

  submitAnswer(userId: string, input: { questionId: string; answerText: string; wordCount?: number }) {
    const question = this.getQuestion(input.questionId);
    const answerText = input.answerText.trim();
    const answerWordCount = input.wordCount ?? countWords(answerText);
    const answerLower = normalize(answerText);

    const hasIntro = /\b(introduction|intro|at the outset|to begin with|background)\b/i.test(answerText);
    const hasConclusion = /\b(conclusion|to conclude|in conclusion|way forward|thus|therefore)\b/i.test(answerText);
    const paragraphCount = answerText.split(/\n{2,}/).filter((segment) => segment.trim().length > 0).length;
    const hasBody = paragraphCount >= 2 || /\b(firstly|secondly|further|moreover|however)\b/i.test(answerText);

    const presentKeywords = question.evaluationRubric.keywords.filter((keyword) => answerLower.includes(normalize(keyword)));
    const missingKeywords = question.evaluationRubric.keywords.filter(
      (keyword) => !presentKeywords.includes(keyword),
    );

    const coveredDimensions = question.evaluationRubric.dimensions.filter((dimension) => {
      return dimension.expectedSignals.some((signal) => answerLower.includes(normalize(signal)));
    });

    const missingDimensions = question.evaluationRubric.dimensions
      .filter((dimension) => !coveredDimensions.includes(dimension))
      .map((dimension) => dimension.name);

    const structureScore = roundToTwoDecimals(((Number(hasIntro) + Number(hasBody) + Number(hasConclusion)) / 3) * 2);
    const depthScore = clamp((answerWordCount / Math.max(1, question.wordLimit)) * 2, 0, 2);
    const dimensionScore = clamp(
      (coveredDimensions.length / Math.max(1, question.evaluationRubric.dimensions.length)) * 2,
      0,
      2,
    );
    const contentScore = roundToTwoDecimals(depthScore + dimensionScore);
    const keywordScore = roundToTwoDecimals(
      (presentKeywords.length / Math.max(1, question.evaluationRubric.keywords.length)) * 2,
    );

    const hasCurrentAffairs =
      /\b(202[4-9]|current affairs|recent|latest|this year|last year|contemporary)\b/i.test(answerText);
    const hasDiagramReference = /\b(diagram|flowchart|table|map|schematic)\b/i.test(answerText);
    const presentationScore = roundToTwoDecimals(Number(hasCurrentAffairs) + Number(hasDiagramReference));

    const breakdown: EvaluationBreakdown = {
      structure: {
        score: structureScore,
        maxScore: 2,
        feedback:
          hasIntro && hasBody && hasConclusion
            ? 'Well-structured response with clear intro-body-conclusion flow.'
            : `Strengthen structure by improving${!hasIntro ? ' introduction,' : ''}${
                !hasBody ? ' body development,' : ''
              }${!hasConclusion ? ' conclusion,' : ''} and transitions.`,
      },
      content: {
        score: contentScore,
        maxScore: 4,
        feedback:
          missingDimensions.length === 0
            ? 'Content depth is good and covers all key rubric dimensions.'
            : 'Answer is partially complete. Expand missing dimensions for stronger depth and balance.',
        missingPoints: missingDimensions,
      },
      keywords: {
        score: keywordScore,
        maxScore: 2,
        present: presentKeywords,
        missing: missingKeywords,
      },
      presentation: {
        score: presentationScore,
        maxScore: 2,
        feedback:
          hasCurrentAffairs && hasDiagramReference
            ? 'Good use of current affairs relevance and visual presentation cues.'
            : `Presentation can improve by adding${
                !hasCurrentAffairs ? ' current affairs references' : ''
              }${!hasCurrentAffairs && !hasDiagramReference ? ' and' : ''}${
                !hasDiagramReference ? ' a diagram/flowchart mention' : ''
              }.`,
      },
    };

    const overallScore = roundToTwoDecimals(
      clamp(
        breakdown.structure.score + breakdown.content.score + breakdown.keywords.score + breakdown.presentation.score,
        0,
        10,
      ),
    );

    const improvements = unique(
      [
        !hasIntro ? 'Begin with a crisp introduction defining the core demand of the question.' : '',
        !hasConclusion ? 'Add a balanced conclusion with a practical way forward.' : '',
        missingDimensions.length > 0
          ? `Cover missing dimensions: ${missingDimensions.slice(0, 3).join(', ')}.`
          : '',
        missingKeywords.length > 0 ? `Include key terms: ${missingKeywords.slice(0, 4).join(', ')}.` : '',
        !hasCurrentAffairs ? 'Add 1-2 recent current affairs references (2024-2026) to improve relevance.' : '',
        !hasDiagramReference ? 'Add a small flowchart or diagram where appropriate to improve presentation.' : '',
      ].filter(Boolean),
    );

    const highlightedGaps = unique([
      ...missingDimensions.map((dimension) => `Missing dimension: ${dimension}`),
      ...missingKeywords.map((keyword) => `Missing keyword: ${keyword}`),
      !hasCurrentAffairs ? 'No explicit current affairs linkage found.' : '',
    ].filter(Boolean));

    const submission: MainsSubmission = {
      id: randomUUID(),
      userId,
      questionId: question.id,
      topicId: question.topicId,
      answerText,
      wordCount: answerWordCount,
      overallScore,
      maxScore: 10,
      breakdown,
      improvements,
      highlightedGaps,
      modelAnswer: question.modelAnswer,
      topperAnswer: question.topperAnswer,
      createdAt: new Date(),
    };

    this.submissionsById.set(submission.id, submission);

    return {
      submissionId: submission.id,
      overallScore: submission.overallScore,
      maxScore: submission.maxScore,
      breakdown: submission.breakdown,
      improvements: submission.improvements,
      modelAnswer: submission.modelAnswer,
      topperAnswer: submission.topperAnswer,
      highlightedGaps: submission.highlightedGaps,
      missedByStudent: submission.highlightedGaps,
      missingDimensions,
      currentAffairsIntegrated: hasCurrentAffairs,
      diagramSuggested: !hasDiagramReference,
    };
  }

  listSubmissions(userId: string, filter: ListSubmissionsFilter = {}) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 10;

    const filtered = [...this.submissionsById.values()]
      .filter((submission) => submission.userId === userId)
      .filter((submission) => (filter.topicId ? submission.topicId === filter.topicId : true))
      .filter((submission) => (filter.questionId ? submission.questionId === filter.questionId : true))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const start = (page - 1) * limit;
    const end = start + limit;

    const improvementByTopic = [...filtered.reduce((acc, submission) => {
      const current = acc.get(submission.topicId) ?? {
        topicId: submission.topicId,
        attempts: 0,
        latestScore: submission.overallScore,
        firstScore: submission.overallScore,
      };

      current.attempts += 1;
      current.latestScore = submission.overallScore;
      current.firstScore = current.attempts === 1 ? submission.overallScore : current.firstScore;
      acc.set(submission.topicId, current);
      return acc;
    }, new Map<string, { topicId: string; attempts: number; latestScore: number; firstScore: number }>()).values()].map(
      (entry) => ({
        topicId: entry.topicId,
        attempts: entry.attempts,
        latestScore: entry.latestScore,
        improvement: roundToTwoDecimals(entry.latestScore - entry.firstScore),
      }),
    );

    return {
      items: filtered.slice(start, end).map((submission) => ({
        id: submission.id,
        questionId: submission.questionId,
        topicId: submission.topicId,
        overallScore: submission.overallScore,
        maxScore: submission.maxScore,
        createdAt: submission.createdAt,
      })),
      improvementByTopic,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      },
    };
  }

  getSubmission(userId: string, submissionId: string) {
    const submission = this.submissionsById.get(submissionId);
    if (!submission || submission.userId !== userId) {
      throw new AppError('Mains submission not found', 404);
    }

    return {
      id: submission.id,
      questionId: submission.questionId,
      topicId: submission.topicId,
      answerText: submission.answerText,
      wordCount: submission.wordCount,
      overallScore: submission.overallScore,
      maxScore: submission.maxScore,
      breakdown: submission.breakdown,
      improvements: submission.improvements,
      highlightedGaps: submission.highlightedGaps,
      modelAnswer: submission.modelAnswer,
      topperAnswer: submission.topperAnswer,
      createdAt: submission.createdAt,
    };
  }

  private seedQuestions() {
    const topics = this.knowledgeGraphService.listAllTopics();
    const fallbackTopics = [
      { id: randomUUID(), name: 'Indian Polity' },
      { id: randomUUID(), name: 'Governance' },
      { id: randomUUID(), name: 'Environment' },
    ];

    const targetTopics = topics.length > 0 ? topics.map((topic) => ({ id: topic.id, name: topic.name })) : fallbackTopics;

    const makeQuestion = (
      topic: { id: string; name: string },
      type: MainsQuestionType,
      marks: number,
      index: number,
    ): MainsQuestion => {
      const questionText = `Discuss ${topic.name} in the context of UPSC Mains and suggest a balanced way forward (${marks} marks).`;
      return {
        id: randomUUID(),
        topicId: topic.id,
        topicName: topic.name,
        questionText,
        marks,
        wordLimit: marks === 15 ? 250 : 150,
        type,
        year: type === 'pyq' ? 2018 + (index % 7) : undefined,
        modelAnswer:
          `Introduction: define ${topic.name}. Body: cover constitutional/administrative dimensions, examples, and challenges. ` +
          'Conclusion: pragmatic reforms and way forward with current affairs support.',
        topperAnswer:
          `A high-scoring answer on ${topic.name} uses crisp intro, structured sub-headings, one flowchart/table, and a balanced conclusion.`,
        evaluationRubric: {
          keywords: ['constitutional basis', 'challenges', 'way forward', 'inclusive growth', topic.name.toLowerCase()],
          dimensions: [
            { name: 'Conceptual clarity', expectedSignals: ['definition', 'scope', 'features'] },
            { name: 'Critical analysis', expectedSignals: ['challenge', 'constraint', 'limitation', 'issue'] },
            { name: 'Balanced way forward', expectedSignals: ['reform', 'recommendation', 'way forward', 'strategy'] },
          ],
        },
      };
    };

    targetTopics.slice(0, 8).forEach((topic, index) => {
      const configurations: Array<{ type: MainsQuestionType; marks: number }> = [
        { type: 'pyq', marks: 10 },
        { type: 'coaching', marks: 15 },
        { type: 'ai_generated', marks: 10 },
      ];

      configurations.forEach(({ type, marks }, configIndex) => {
        const question = makeQuestion(topic, type, marks, index + configIndex);
        this.questionsById.set(question.id, question);
      });
    });
  }
}

const defaultMainsEvaluationService = new MainsEvaluationService();

export const createMainsEvaluationService = (knowledgeGraphService?: KnowledgeGraphService): MainsEvaluationService => {
  if (!knowledgeGraphService) {
    return defaultMainsEvaluationService;
  }

  return new MainsEvaluationService(knowledgeGraphService);
};
