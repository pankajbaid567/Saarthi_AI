import mongoose, { Schema } from 'mongoose';
import type { PdfExtractedContent } from '../services/pdf-content-classifier.service.js';

export type PdfExtractedPage = {
  pageNumber: number;
  text: string;
  tables: string[];
};

export type PdfExtractedTextDocument = {
  pdfDocumentId: string;
  fullText: string;
  pages: PdfExtractedPage[];
  usedOcr: boolean;
  extractedContent: PdfExtractedContent;
  createdAt: Date;
  updatedAt: Date;
};

const pdfExtractedPageSchema = new Schema<PdfExtractedPage>(
  {
    pageNumber: { type: Number, required: true },
    text: { type: String, required: true },
    tables: { type: [String], default: [] },
  },
  { _id: false },
);

const pdfExtractedTextSchema = new Schema<PdfExtractedTextDocument>(
  {
    pdfDocumentId: { type: String, required: true, unique: true, index: true },
    fullText: { type: String, required: true },
    pages: { type: [pdfExtractedPageSchema], default: [] },
    usedOcr: { type: Boolean, default: false },
    extractedContent: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
    collection: 'pdf_extracted_text',
  },
);

export const PdfExtractedTextModel = mongoose.model<PdfExtractedTextDocument>(
  'PdfExtractedText',
  pdfExtractedTextSchema,
);
