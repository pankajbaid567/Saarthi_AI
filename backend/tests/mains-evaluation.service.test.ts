import { describe, expect, it } from 'vitest';

import { MainsEvaluationService } from '../src/services/mains-evaluation.service.js';

describe('mains evaluation service', () => {
  it('lists questions with pagination and filters', () => {
    const service = new MainsEvaluationService();
    const firstPage = service.listQuestions({ page: 1, limit: 5 });

    expect(firstPage.items).toHaveLength(5);
    expect(firstPage.pagination.total).toBeGreaterThan(0);

    const pyqOnly = service.listQuestions({ type: 'pyq', limit: 50 });
    expect(pyqOnly.items.every((item) => item.type === 'pyq')).toBe(true);
  });

  it('evaluates submissions and returns detailed feedback', () => {
    const service = new MainsEvaluationService();
    const question = service.listQuestions({ limit: 1 }).items[0];

    const result = service.submitAnswer('student-1', {
      questionId: question.id,
      answerText:
        'Introduction: The topic has constitutional basis and major challenges. ' +
        'Firstly, issue analysis with examples from current affairs 2025. ' +
        'Secondly, way forward includes inclusive growth and administrative reform. ' +
        'Conclusion: Therefore, a balanced strategy with a flowchart is required.',
    });

    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.breakdown.keywords.present.length).toBeGreaterThan(0);
    expect(result.improvements).toBeInstanceOf(Array);
    expect(result.highlightedGaps).toBeInstanceOf(Array);
  });

  it('returns and protects submission retrieval by user', () => {
    const service = new MainsEvaluationService();
    const question = service.listQuestions({ limit: 1 }).items[0];
    const submission = service.submitAnswer('student-1', {
      questionId: question.id,
      answerText: 'Introduction. Body with challenges and way forward. Conclusion.',
    });

    const fetched = service.getSubmission('student-1', submission.submissionId);
    expect(fetched.id).toBe(submission.submissionId);

    expect(() => service.getSubmission('student-2', submission.submissionId)).toThrow('not found');
  });
});
