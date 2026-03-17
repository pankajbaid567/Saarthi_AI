import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createPerformanceRouter } from '../src/routes/performance.routes.js';
import { PerformanceService } from '../src/services/performance.service.js';

const issueAccessToken = (userId: string): string => {
  return jwt.sign(
    {
      sub: userId,
      role: 'student',
      email: 'student@example.com',
    },
    env.jwtAccessSecret,
    { expiresIn: env.accessTokenTtlSeconds },
  );
};

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(
    '/api/v1',
    createPerformanceRouter({
      performanceService: new PerformanceService(),
    }),
  );
  app.use(errorHandler);
  return app;
};

describe('performance routes', () => {
  it('returns week 20 prediction payload', async () => {
    const app = createTestApp();
    const token = issueAccessToken('student-user-id');

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
    const token = issueAccessToken('student-user-id');

    const weakAreaResponse = await request(app)
      .get('/api/v1/performance/weak-areas')
      .set('Authorization', `Bearer ${token}`);
    expect(weakAreaResponse.status).toBe(200);
    expect(weakAreaResponse.body.success).toBe(true);
    expect(Array.isArray(weakAreaResponse.body.data)).toBe(true);
    expect(weakAreaResponse.body.data.length).toBeGreaterThan(0);

    const unknownSubjectResponse = await request(app)
      .get('/api/v1/performance/subject/99999999-9999-4999-8999-999999999999')
      .set('Authorization', `Bearer ${token}`);
    expect(unknownSubjectResponse.status).toBe(404);
  });
});
