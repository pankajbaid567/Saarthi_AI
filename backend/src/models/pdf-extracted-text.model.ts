import mongoose, { Schema } from 'mongoose';

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
