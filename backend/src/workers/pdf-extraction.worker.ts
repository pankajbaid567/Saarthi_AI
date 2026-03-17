import { createPdfService } from '../services/pdf.service.js';

export const startPdfExtractionWorker = (): void => {
  createPdfService();
};
