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
  it('returns overview, subject/topic deep dives, and weak areas for authenticated user', async () => {
    const app = createTestApp();
    const studentToken = issueAccessToken('student', 'student-user-id');

    const overview = await request(app).get('/api/v1/performance/overview').set('Authorization', `Bearer ${studentToken}`);
    expect(overview.status).toBe(200);
    expect(overview.body).toHaveProperty('snapshot');
    expect(overview.body).toHaveProperty('trajectory');
    expect(overview.body).toHaveProperty('retentionAverage');
    expect(overview.body).toHaveProperty('syllabusCompletionAverage');

    const subject = await request(app)
      .get('/api/v1/performance/subject/history')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(subject.status).toBe(200);
    expect(subject.body).toEqual(expect.objectContaining({ subjectId: 'history' }));

    const topic = await request(app).get('/api/v1/performance/topic/modern').set('Authorization', `Bearer ${studentToken}`);
    expect(topic.status).toBe(200);
    expect(topic.body).toEqual(expect.objectContaining({ topicId: 'modern' }));

    const weakAreas = await request(app)
      .get('/api/v1/performance/weak-areas')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(weakAreas.status).toBe(200);
    expect(weakAreas.body).toHaveProperty('weakAreas');
  });
});

