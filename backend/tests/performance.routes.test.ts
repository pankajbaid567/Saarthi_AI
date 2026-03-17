import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createPerformanceRouter } from '../src/routes/performance.routes.js';
import { PerformanceService, type PerformanceQuestionAttempt } from '../src/services/performance.service.js';

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

const attempts: PerformanceQuestionAttempt[] = [
  {
    id: 'a-1',
    userId: 'student-user-id',
    subjectId: 'polity',
    subjectName: 'Polity',
    topicId: 'fr',
    topicName: 'Fundamental Rights',
    isCorrect: true,
    timeSpentSeconds: 30,
    completedAt: new Date('2026-03-16T09:00:00.000Z'),
  },
  {
    id: 'a-2',
    userId: 'student-user-id',
    subjectId: 'history',
    subjectName: 'History',
    topicId: 'modern',
    topicName: 'Modern India',
    isCorrect: false,
    timeSpentSeconds: 70,
    completedAt: new Date('2026-03-16T09:01:00.000Z'),
  },
];

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(
    '/api/v1',
    createPerformanceRouter({
      performanceService: new PerformanceService({
        attempts,
        subjectRetention: [{ userId: 'student-user-id', subjectId: 'history', averageRetention: 52 }],
        subjectSyllabusCompletion: [{ userId: 'student-user-id', subjectId: 'history', completionPercentage: 41 }],
      }),
    }),
  );
  app.use(errorHandler);
  return app;
};

describe('performance routes', () => {
  it('returns week 20 prediction payload', async () => {
    const app = createTestApp();
    const token = issueAccessToken('student', 'student-user-id');

    const response = await request(app).get('/api/v1/performance/predictions').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('prelimsPrediction.score');
    expect(response.body.data).toHaveProperty('prelimsPrediction.confidenceInterval');
    expect(response.body.data).toHaveProperty('estimatedRank.range');
    expect(response.body.data).toHaveProperty('modelFactors.retentionScore');
  });

  it('returns weak areas and rejects unknown subject ids', async () => {
    const app = createTestApp();
    const token = issueAccessToken('student', 'student-user-id');

    const weakAreaResponse = await request(app)
      .get('/api/v1/performance/weak-areas')
      .set('Authorization', `Bearer ${token}`);
    expect(weakAreaResponse.status).toBe(200);
    expect(weakAreaResponse.body.success).toBe(true);
    expect(Array.isArray(weakAreaResponse.body.data)).toBe(true);
    expect(weakAreaResponse.body.data.length).toBeGreaterThan(0);

    const unknownSubjectResponse = await request(app)
      .get('/api/v1/performance/subject/unknown-subject')
      .set('Authorization', `Bearer ${token}`);
    expect(unknownSubjectResponse.status).toBe(404);
  });
});
