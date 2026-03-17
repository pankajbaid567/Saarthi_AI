import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createSecondBrainRouter } from '../src/routes/second-brain.routes.js';
import { createStrategyRouter } from '../src/routes/strategy.routes.js';

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
  app.use('/api/v1', createStrategyRouter());
  app.use('/api/v1', createSecondBrainRouter());
  app.use(errorHandler);
  return app;
};

describe('week 21 routes', () => {
  it('supports strategy planning and second-brain workflows', async () => {
    const app = createTestApp();
    const studentToken = issueAccessToken('student', 'student-week21');

    const today = await request(app).get('/api/v1/strategy/today').set('Authorization', `Bearer ${studentToken}`);
    expect(today.status).toBe(200);
    expect(today.body.tasks.some((task: { type: string }) => task.type === 'revision')).toBe(true);
    expect(today.body.tasks.some((task: { type: string }) => task.type === 'practice')).toBe(true);

    const regenerated = await request(app)
      .post('/api/v1/strategy/generate')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        weakAreas: ['Economy - Inflation', 'Polity - FR vs DPSP', 'Environment - Biomes', 'History - Acts'],
        retentionUrgencyCount: 5,
        timeAvailableMinutes: 120,
        prelimsFocusPercent: 0.7,
        targetDate: new Date().toISOString(),
      });
    expect(regenerated.status).toBe(200);
    expect(regenerated.body.today.summary.overloadAdjusted).toBe(true);

    const firstTaskId = regenerated.body.today.tasks[0].id as string;
    const complete = await request(app)
      .put(`/api/v1/strategy/${firstTaskId}/complete`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ completed: true });
    expect(complete.status).toBe(200);
    expect(complete.body.summary.completionPercent).toBeGreaterThan(0);

    const week = await request(app).get('/api/v1/strategy/week').set('Authorization', `Bearer ${studentToken}`);
    expect(week.status).toBe(200);
    expect(week.body.plans).toHaveLength(7);
    expect(week.body.targets.weeklyPracticeQuestions).toBeGreaterThan(0);

    const entryOne = await request(app)
      .post('/api/v1/second-brain/entries')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Federalism and Fiscal Stability',
        content: 'Interlink GST compensation with cooperative federalism revision.',
        tags: ['polity', 'economy'],
        importance: 'high',
      });
    expect(entryOne.status).toBe(201);

    const entryTwo = await request(app)
      .post('/api/v1/second-brain/entries')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Climate Financing and Local Governance',
        content: 'Panchayat adaptation plans need better climate-linked grants.',
        tags: ['economy', 'environment'],
      });
    expect(entryTwo.status).toBe(201);

    const filtered = await request(app)
      .get('/api/v1/second-brain/entries')
      .query({ q: 'federalism' })
      .set('Authorization', `Bearer ${studentToken}`);
    expect(filtered.status).toBe(200);
    expect(filtered.body).toHaveLength(1);

    const updated = await request(app)
      .put(`/api/v1/second-brain/entries/${entryOne.body.id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        tags: ['polity', 'economy', 'governance'],
      });
    expect(updated.status).toBe(200);
    expect(updated.body.tags).toContain('governance');

    const connections = await request(app)
      .get('/api/v1/second-brain/connections')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(connections.status).toBe(200);
    expect(connections.body.length).toBeGreaterThan(0);

    const insights = await request(app)
      .get('/api/v1/second-brain/insights/auto-generated')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(insights.status).toBe(200);
    expect(insights.body.length).toBeGreaterThan(0);

    const deleted = await request(app)
      .delete(`/api/v1/second-brain/entries/${entryTwo.body.id}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(deleted.status).toBe(204);
  });
});
