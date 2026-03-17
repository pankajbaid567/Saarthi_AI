import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';
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

const createTestAccessToken = (role: 'student' | 'admin', userId = `${role}-user-id`): string => {
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

describe('GET /api/v1/tests/:id/analytics integration', () => {
  it('returns analytics through mounted app router when backend is connected', async () => {
    const app = createApp({ analyticsService: new AnalyticsService({ attempts: [attempt] }) });
    const studentToken = createTestAccessToken('student', 'student-user-id');

    const response = await request(app)
      .get(`/api/v1/tests/${testId}/analytics`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.testId).toBe(testId);
    expect(response.body.ai.insights).toBeTruthy();
  });

  it('returns 404 when analytics data is unavailable for test id', async () => {
    const app = createApp({ analyticsService: new AnalyticsService({ attempts: [attempt] }) });
    const studentToken = createTestAccessToken('student', 'student-user-id');

    const response = await request(app)
      .get('/api/v1/tests/22222222-2222-4222-8222-222222222222/analytics')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(response.status).toBe(404);
  });
});
