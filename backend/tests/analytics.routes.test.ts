import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createAnalyticsRouter } from '../src/routes/analytics.routes.js';
import { AnalyticsService, type TestAnalyticsAttempt } from '../src/services/analytics.service.js';

const testId = '11111111-1111-4111-8111-111111111111';

const attempt: TestAnalyticsAttempt = {
  id: testId,
  userId: 'student-user-id',
  responses: [
    {
      questionId: 'q-1',
      subject: 'Geography',
      topic: 'Monsoon',
      correctAnswer: 'A',
      finalAnswer: 'B',
      answerTrail: ['A', 'B'],
      isCorrect: false,
      timeSpentSeconds: 11,
    },
  ],
};

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
  app.use('/api/v1', createAnalyticsRouter({ analyticsService: new AnalyticsService({ attempts: [attempt] }) }));
  app.use(errorHandler);

  return app;
};

describe('analytics routes', () => {
  it('returns detailed analytics for authenticated user', async () => {
    const app = createTestApp();
    const studentToken = issueAccessToken('student', 'student-user-id');

    const response = await request(app)
      .get(`/api/v1/tests/${testId}/analytics`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('accuracyByTopic');
    expect(response.body).toHaveProperty('timeAnalysis');
    expect(response.body).toHaveProperty('sillyMistakes');
    expect(response.body).toHaveProperty('guessingPatterns');
    expect(response.body).toHaveProperty('conceptGaps');
    expect(response.body).toHaveProperty('ai.insights');
  });
});
