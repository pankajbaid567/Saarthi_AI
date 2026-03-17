import type { ExtractedPdfPage } from './pdf-extractor.service.js';

export type ExtractedSectionType = 'concept' | 'fact' | 'mcq' | 'mains_question' | 'case_study';

export type ExtractedSection = {
  heading: string | null;
  text: string;
  bullets: string[];
  type: ExtractedSectionType;
  confidence: number;
  requiresReview: boolean;
};

export type ExtractedMcq = {
  question: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  correctAnswer: 'A' | 'B' | 'C' | 'D' | null;
  explanation: string | null;
};

export type ExtractedMainsQuestion = {
  question: string;
  marks: number | null;
  modelAnswer: string | null;
};

export type ExtractedKeyFacts = {
  importantItems: string[];
  constitutionalArticles: string[];
  actsAndAmendments: string[];
};

export type PdfExtractedContent = {
  structure: {
    headings: Array<{ level: number; title: string }>;
    sections: ExtractedSection[];
    preservedTables: string[];
  };
  promptTemplate: string;
  confidenceThreshold: number;
  mcqs: ExtractedMcq[];
  mainsQuestions: ExtractedMainsQuestion[];
  keyFacts: ExtractedKeyFacts;
  reviewQueue: ExtractedSection[];
  autoApprovedSections: number;
};

const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;
const MAX_NUMERIC_FACTS = 50;
const MARKDOWN_HEADING_PATTERN = /^#{1,6}\s+\S+/;
const NUMBERED_HEADING_PATTERN = /^\d+(\.\d+)*[).:-]?\s+[A-Za-z]/;
const UPPERCASE_HEADING_PATTERN = /^[A-Z][A-Z\s-]{2,}$/;
const CASE_STUDY_PATTERN = /(case\s*study|scenario|situation)\b/;
const MCQ_SECTION_PATTERN = /(a\)|b\)|c\)|d\)|option\s+a|option\s+b|correct answer)\b/;
const MAINS_SECTION_PATTERN = /(discuss|explain|analy[sz]e|critically evaluate|long answer|mains)\b/;
const FACT_SECTION_PATTERN = /\b(article\s+\d+[a-z]?|act\s+\d{4}|amendment)\b/;
const YEAR_PATTERN = /\b\d{4}\b/;

const CLASSIFICATION_PROMPT_TEMPLATE = `Classify each section into one of:
- concept
- fact
- mcq
- mains_question
- case_study
Return a confidence score between 0 and 1 for each section.`;

const clampConfidence = (value: number): number => {
  return Number(Math.max(0, Math.min(1, value)).toFixed(2));
};

const toLines = (value: string): string[] => {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
};

const isHeading = (line: string): boolean => {
  return MARKDOWN_HEADING_PATTERN.test(line) || NUMBERED_HEADING_PATTERN.test(line) || UPPERCASE_HEADING_PATTERN.test(line);
};

const getHeadingLevel = (line: string): number => {
  const hashMatch = line.match(/^(#{1,6})\s+/);
  if (hashMatch?.[1]) {
    return hashMatch[1].length;
  }
  return 1;
};

const getHeadingText = (line: string): string => {
  return line.replace(/^#{1,6}\s+/, '').trim();
};

const extractBullets = (text: string): string[] => {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^([-*•]|\d+[).])\s+/.test(line))
    .map((line) => line.replace(/^([-*•]|\d+[).])\s+/, '').trim())
    .filter(Boolean);
};

const classifySection = (text: string): { type: ExtractedSectionType; confidence: number } => {
  const normalized = text.toLowerCase();

  if (CASE_STUDY_PATTERN.test(normalized)) {
    return { type: 'case_study', confidence: clampConfidence(0.86) };
  }

  if (MCQ_SECTION_PATTERN.test(normalized)) {
    return { type: 'mcq', confidence: clampConfidence(0.88) };
  }

  if (MAINS_SECTION_PATTERN.test(normalized)) {
    return { type: 'mains_question', confidence: clampConfidence(0.8) };
  }

  if (FACT_SECTION_PATTERN.test(normalized) || YEAR_PATTERN.test(normalized)) {
    return { type: 'fact', confidence: clampConfidence(0.76) };
  }

  return { type: 'concept', confidence: clampConfidence(0.72) };
};

const extractMcqs = (fullText: string): ExtractedMcq[] => {
  const blocks = fullText.split(/\n\s*\n/);
  const mcqs: ExtractedMcq[] = [];

  for (const block of blocks) {
    const lines = toLines(block);
    if (lines.length < 5) {
      continue;
    }

    const question = lines[0] ?? '';
    if (
      !/\?$/.test(question) &&
      !/^(?:q(?:uestion)?\s*)?\d+[).:-]/i.test(question) &&
      !/^q\d+[).:-]?/i.test(question)
    ) {
      continue;
    }

    const optionMap: Partial<Record<'A' | 'B' | 'C' | 'D', string>> = {};
    for (const line of lines.slice(1)) {
      const optionMatch = line.match(/^([A-D])[).:-]\s*(.+)$/i);
      if (optionMatch?.[1] && optionMatch[2]) {
        const optionKey = optionMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
        optionMap[optionKey] = optionMatch[2].trim();
      }
    }

    if (!optionMap.A || !optionMap.B || !optionMap.C || !optionMap.D) {
      continue;
    }

    const answerMatch = block.match(/(?:correct answer|answer)\s*[:-]\s*([A-D])/i);
    const explanationMatch = block.match(/explanation\s*[:-]\s*([\s\S]+)$/i);

    mcqs.push({
      question,
      options: {
        A: optionMap.A,
        B: optionMap.B,
        C: optionMap.C,
        D: optionMap.D,
      },
      correctAnswer: answerMatch?.[1] ? (answerMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D') : null,
      explanation: explanationMatch?.[1]?.trim() ?? null,
    });
  }

  return mcqs;
};

const extractMainsQuestions = (fullText: string): ExtractedMainsQuestion[] => {
  const lines = toLines(fullText);
  return lines.flatMap((line) => {
    if (!/(discuss|explain|analy[sz]e|critically evaluate|long answer|mains)/i.test(line)) {
      return [];
    }

    const marksMatch = line.match(/(?:\(|\[)\s*(\d{1,3})\s*marks?\s*(?:\)|\])/i);
    const modelAnswerMatch = line.match(/model answer\s*[:-]\s*(.+)$/i);

    return [
      {
        question: line,
        marks: marksMatch?.[1] ? Number(marksMatch[1]) : null,
        modelAnswer: modelAnswerMatch?.[1]?.trim() ?? null,
      },
    ];
  });
};

const uniqueSorted = (values: string[]): string[] => {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'en', { sensitivity: 'base' }),
  );
};

const extractKeyFacts = (fullText: string): ExtractedKeyFacts => {
  const contextualNumberMatches =
    fullText.match(/\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:%|crore|lakh|million|billion|km|kg|marks?)\b/gi) ?? [];
  const dateAndNumberMatches = [
    ...(fullText.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g) ?? []),
    ...(fullText.match(/\b(18|19|20)\d{2}\b/g) ?? []),
    ...contextualNumberMatches,
  ].slice(0, MAX_NUMERIC_FACTS);
  const articleMatches = fullText.match(/\bArticle\s+\d+[A-Z]?\b/gi) ?? [];
  const actMatches = [
    ...(fullText.match(/\b[A-Z][A-Za-z\s]+ Act,?\s+\d{4}\b/g) ?? []),
    ...(fullText.match(/\b\d{1,3}(?:st|nd|rd|th)\s+Amendment\b/gi) ?? []),
  ];

  return {
    importantItems: uniqueSorted(dateAndNumberMatches),
    constitutionalArticles: uniqueSorted(articleMatches),
    actsAndAmendments: uniqueSorted(actMatches),
  };
};

export class PdfContentClassifierService {
  classify(fullText: string, pages: ExtractedPdfPage[]): PdfExtractedContent {
    const lines = toLines(fullText);
    const headings = lines.filter(isHeading).map((line) => ({ level: getHeadingLevel(line), title: getHeadingText(line) }));

    const sections: Array<{ heading: string | null; contentLines: string[] }> = [];
    let currentSection: { heading: string | null; contentLines: string[] } = { heading: null, contentLines: [] };

    for (const line of lines) {
      if (isHeading(line)) {
        if (currentSection.contentLines.length > 0 || currentSection.heading) {
          sections.push(currentSection);
        }
        currentSection = { heading: getHeadingText(line), contentLines: [line] };
        continue;
      }
      currentSection.contentLines.push(line);
    }

    if (currentSection.contentLines.length > 0 || currentSection.heading) {
      sections.push(currentSection);
    }

    const classifiedSections = sections
      .map((section) => {
        const text = section.contentLines.join('\n').trim();
        if (!text) {
          return null;
        }
        const { type, confidence } = classifySection(text);
        return {
          heading: section.heading,
          text,
          bullets: extractBullets(text),
          type,
          confidence,
          requiresReview: confidence < DEFAULT_CONFIDENCE_THRESHOLD,
        };
      })
      .filter((section): section is ExtractedSection => section !== null);

    const preservedTables = uniqueSorted(pages.flatMap((page) => page.tables));
    const mcqs = extractMcqs(fullText);
    const mainsQuestions = extractMainsQuestions(fullText);
    const keyFacts = extractKeyFacts(fullText);
    const reviewQueue = classifiedSections.filter((section) => section.requiresReview);

    return {
      structure: {
        headings,
        sections: classifiedSections,
        preservedTables,
      },
      promptTemplate: CLASSIFICATION_PROMPT_TEMPLATE,
      confidenceThreshold: DEFAULT_CONFIDENCE_THRESHOLD,
      mcqs,
      mainsQuestions,
      keyFacts,
      reviewQueue,
      autoApprovedSections: classifiedSections.length - reviewQueue.length,
    };
  }
}

let defaultPdfContentClassifierService: PdfContentClassifierService | null = null;

export const createPdfContentClassifierService = (): PdfContentClassifierService => {
  if (!defaultPdfContentClassifierService) {
    defaultPdfContentClassifierService = new PdfContentClassifierService();
  }
  return defaultPdfContentClassifierService;
};
