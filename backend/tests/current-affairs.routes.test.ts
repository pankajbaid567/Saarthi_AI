import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createCurrentAffairsRouter } from '../src/routes/current-affairs.routes.js';
import { CurrentAffairsService } from '../src/services/current-affairs.service.js';

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
    createCurrentAffairsRouter({
      currentAffairsService: new CurrentAffairsService(),
    }),
  );
  app.use(errorHandler);
  return app;
};

describe('current affairs routes', () => {
  it('lists and filters monthly articles', async () => {
    const app = createTestApp();
    const token = issueAccessToken('student-user-id');

    const listResponse = await request(app)
      .get('/api/v1/current-affairs?month=3&year=2026&page=1')
      .set('Authorization', `Bearer ${token}`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(Array.isArray(listResponse.body.data)).toBe(true);
    expect(listResponse.body.pagination.total).toBeGreaterThan(0);

    const monthlyResponse = await request(app)
      .get('/api/v1/current-affairs/3/2026')
      .set('Authorization', `Bearer ${token}`);
    expect(monthlyResponse.status).toBe(200);
    expect(monthlyResponse.body.success).toBe(true);
    expect(monthlyResponse.body.data).toHaveProperty('totalArticles');
  });

  it('returns detail for known article and 404 for unknown article', async () => {
    const app = createTestApp();
    const token = issueAccessToken('student-user-id');

    const detailResponse = await request(app)
      .get('/api/v1/current-affairs/71111111-1111-4111-8111-111111111111')
      .set('Authorization', `Bearer ${token}`);
    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.success).toBe(true);
    expect(detailResponse.body.data).toHaveProperty('linkedMcqs');

    const notFoundResponse = await request(app)
      .get('/api/v1/current-affairs/91111111-1111-4111-8111-111111111111')
      .set('Authorization', `Bearer ${token}`);
    expect(notFoundResponse.status).toBe(404);
  });
});
