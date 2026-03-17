import { randomUUID } from 'crypto';

import { AppError } from '../errors/app-error.js';

type EssayQuestion = {
  id: string;
  week: string;
  prompt: string;
  sourceTopics: string[];
};

type EssayEvaluation = {
  structure: number;
  argumentQuality: number;
  language: number;
  coherence: number;
  totalScore: number;
};

type EssaySubmission = {
  id: string;
  userId: string;
  questionId: string;
  answer: string;
  evaluation: EssayEvaluation;
  submittedAt: Date;
};

const essayPromptBank: Array<Omit<EssayQuestion, 'week'>> = [
  {
    id: 'essay-ethics-technology',
    prompt:
      'Technology amplifies human intent more than it changes morality. Discuss with reference to public life and governance.',
    sourceTopics: ['gs4 ethics', 'technology in governance', 'current affairs'],
  },
  {
    id: 'essay-social-justice',
    prompt:
      'Justice delayed in social sectors is development denied. Critically examine with contemporary policy examples.',
    sourceTopics: ['social justice', 'welfare policy', 'current affairs'],
  },
  {
    id: 'essay-civilization-values',
    prompt:
      'Civilizational values can guide modern policy only when translated into institutional behavior. Comment.',
    sourceTopics: ['ethics', 'indian society', 'governance'],
  },
];

const roundToTwo = (value: number): number => Number(value.toFixed(2));
const millisecondsPerDay = 86400000;

export class EssayService {
  private readonly submissions = new Map<string, EssaySubmission[]>();

  getWeeklyQuestion(now: Date = new Date()): EssayQuestion {
    if (essayPromptBank.length === 0) {
      throw new AppError('No essay prompts configured', 500);
    }

    const week = this.getWeekKey(now);
    const weekIndex = this.getYearWeekNumber(now);
    const prompt = essayPromptBank[weekIndex % essayPromptBank.length]!;

    return {
      ...prompt,
      week,
    };
  }

  submitWeeklyEssay(userId: string, answer: string): EssaySubmission {
    const question = this.getWeeklyQuestion();
    const submission: EssaySubmission = {
      id: randomUUID(),
      userId,
      questionId: question.id,
      answer,
      evaluation: this.evaluateEssay(answer),
      submittedAt: new Date(),
    };

    const existing = this.submissions.get(userId) ?? [];
    this.submissions.set(userId, [submission, ...existing]);
    return submission;
  }

  listSubmissions(userId: string): EssaySubmission[] {
    return this.submissions.get(userId) ?? [];
  }

  private evaluateEssay(answer: string): EssayEvaluation {
    const wordCount = answer
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const paragraphCount = answer
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean).length;
    const hasConclusion = /conclusion|therefore|to conclude/i.test(answer);
    const hasExamples = /(for example|e\.g\.|such as|instance)/i.test(answer);
    const sentenceCount = Math.max(1, answer.split(/[.!?]+/).filter((value) => value.trim().length > 0).length);
    const avgWordsPerSentence = wordCount / sentenceCount;

    const structure = Math.min(10, roundToTwo(4 + Math.min(paragraphCount, 6) * 0.75 + (hasConclusion ? 1 : 0)));
    const argumentQuality = Math.min(10, roundToTwo(3 + Math.min(wordCount / 120, 5) + (hasExamples ? 2 : 0)));
    const language = Math.min(10, roundToTwo(5 + (avgWordsPerSentence >= 8 && avgWordsPerSentence <= 24 ? 2 : 0)));
    const coherence = Math.min(10, roundToTwo(4 + Math.min(paragraphCount, 5) * 0.8 + (hasConclusion ? 1 : 0)));
    const totalScore = roundToTwo((structure + argumentQuality + language + coherence) / 4);

    return {
      structure,
      argumentQuality,
      language,
      coherence,
      totalScore,
    };
  }

  private getWeekKey(date: Date): string {
    const [year, weekNumber] = this.getIsoWeekYearAndNumber(date);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  }

  private getYearWeekNumber(date: Date): number {
    return this.getIsoWeekYearAndNumber(date)[1];
  }

  private getIsoWeekYearAndNumber(date: Date): [number, number] {
    const working = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayNumber = working.getUTCDay() || 7;
    working.setUTCDate(working.getUTCDate() + 4 - dayNumber);
    const yearStart = new Date(Date.UTC(working.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil((((working.getTime() - yearStart.getTime()) / millisecondsPerDay) + 1) / 7);
    return [working.getUTCFullYear(), weekNumber];
  }
}

const defaultEssayService = new EssayService();

export const createEssayService = (): EssayService => defaultEssayService;
