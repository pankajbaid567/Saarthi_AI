import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';

export type ExtractedPdfPage = {
  pageNumber: number;
  text: string;
  tables: string[];
};

export type ExtractPdfResult = {
  pages: ExtractedPdfPage[];
  fullText: string;
  usedOcr: boolean;
};

const detectTables = (text: string): string[] => {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.includes('|') || line.split(/\s{2,}|\t+/).length >= 3);
};

const toPages = (value: string): string[] => {
  return value
    .split(/\f+/)
    .map((page) => page.trim())
    .filter(Boolean);
};

const extractWithOcr = async (buffer: Buffer): Promise<string> => {
  const worker = await createWorker('eng');

  try {
    const {
      data: { text },
    } = await worker.recognize(buffer);
    return text.trim();
  } finally {
    await worker.terminate();
  }
};

export interface PdfExtractorService {
  extract(buffer: Buffer): Promise<ExtractPdfResult>;
}

export class DefaultPdfExtractorService implements PdfExtractorService {
  async extract(buffer: Buffer): Promise<ExtractPdfResult> {
    const parsed = await pdfParse(buffer);
    const parsedPages = toPages(parsed.text);

    if (parsedPages.length > 0) {
      const pages = parsedPages.map((text, index) => ({
        pageNumber: index + 1,
        text,
        tables: detectTables(text),
      }));

      return {
        pages,
        fullText: pages.map((page) => page.text).join('\n'),
        usedOcr: false,
      };
    }

    const ocrText = await extractWithOcr(buffer);
    const pages = [
      {
        pageNumber: 1,
        text: ocrText,
        tables: detectTables(ocrText),
      },
    ];

    return {
      pages,
      fullText: ocrText,
      usedOcr: true,
    };
  }
}

export const createPdfExtractorService = (): PdfExtractorService => new DefaultPdfExtractorService();
