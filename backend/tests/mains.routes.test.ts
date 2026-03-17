import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createMainsRouter } from '../src/routes/mains.routes.js';

const issueAccessToken = (role: 'student' | 'admin', userId = `${role}-user-id`): string => {
  return jwt.sign(
    {
      sub: userId,
      role,
      email: `${role}@example.com`,
    },
    env.jwtAccessSecret,
    { expiresIn: env.accessTokenTtlSeconds },
  );
};

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1', createMainsRouter());
  app.use(errorHandler);
  return app;
};

describe('mains routes', () => {
  it('supports question listing, answer submission, and submission retrieval', async () => {
    const app = createTestApp();
    const studentToken = issueAccessToken('student', 'student-1');

    const listResponse = await request(app).get('/api/v1/mains/questions');
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.items.length).toBeGreaterThan(0);

    const question = listResponse.body.items[0] as {
      id: string;
      evaluationRubric: { keywords: string[] };
      topicName: string;
    };

    const questionResponse = await request(app).get(`/api/v1/mains/questions/${question.id}`);
    expect(questionResponse.status).toBe(200);
    expect(questionResponse.body.id).toBe(question.id);

    const answerText = [
      `Introduction: ${question.topicName} is an important UPSC theme with constitutional basis.`,
      'Body: Key challenges include implementation issues, but reforms and inclusive growth can improve outcomes.',
      'Current affairs 2025 examples show why a flowchart and way forward are useful in the answer.',
      'Conclusion: A balanced strategy with clear recommendations is required.',
      ...question.evaluationRubric.keywords.slice(0, 2),
    ].join(' ');

    const unauthorized = await request(app).post('/api/v1/mains/submit').send({
      questionId: question.id,
      answerText,
    });
    expect(unauthorized.status).toBe(401);

    const submitResponse = await request(app)
      .post('/api/v1/mains/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        questionId: question.id,
        answerText,
      });

    expect(submitResponse.status).toBe(200);
    expect(submitResponse.body.submissionId).toBeDefined();
    expect(submitResponse.body.overallScore).toBeGreaterThan(0);

    const submissionsResponse = await request(app)
      .get('/api/v1/mains/submissions')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(submissionsResponse.status).toBe(200);
    expect(submissionsResponse.body.items).toHaveLength(1);

    const submissionId = submitResponse.body.submissionId as string;
    const submissionDetailResponse = await request(app)
      .get(`/api/v1/mains/submissions/${submissionId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(submissionDetailResponse.status).toBe(200);
    expect(submissionDetailResponse.body.id).toBe(submissionId);
  });
});
