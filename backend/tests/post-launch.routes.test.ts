import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createPostLaunchRouter } from '../src/routes/post-launch.routes.js';

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
  app.use('/api/v1', createPostLaunchRouter());
  app.use(errorHandler);
  return app;
};

describe('post-launch routes', () => {
  it('requires auth and returns v1.1-v1.5 kickoff payloads', async () => {
    const app = createTestApp();
    const studentToken = issueAccessToken('student', 'student-v1');

    const unauthenticated = await request(app).get('/api/v1/post-launch/community');
    expect(unauthenticated.status).toBe(401);

    const community = await request(app).get('/api/v1/post-launch/community').set('Authorization', `Bearer ${studentToken}`);
    expect(community.status).toBe(200);
    expect(community.body.forumsByTopic.length).toBeGreaterThan(0);
    expect(community.body.leaderboards.revisionStreak.length).toBeGreaterThan(0);

    const forumEntry = await request(app)
      .post('/api/v1/post-launch/community/forums/polity-federalism/messages')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'Sharing a framework for Centre-State fiscal devolution.' });
    expect(forumEntry.status).toBe(201);
    expect(forumEntry.body.topicId).toBe('polity-federalism');

    const advancedAi = await request(app).get('/api/v1/post-launch/advanced-ai').set('Authorization', `Bearer ${studentToken}`);
    expect(advancedAi.status).toBe(200);
    expect(advancedAi.body.modes.some((mode: { id: string }) => mode.id === 'upsc-thinking')).toBe(true);

    const analysis = await request(app)
      .post('/api/v1/post-launch/advanced-ai/error-analysis')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        questionId: 'q-1',
        userAnswer: 'Option B',
        correctAnswer: 'Option C',
        topicId: 'economy-inflation',
      });
    expect(analysis.status).toBe(200);
    expect(analysis.body.neuroReviseContext.topicId).toBe('economy-inflation');

    const contentExpansion = await request(app)
      .get('/api/v1/post-launch/content-expansion')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(contentExpansion.status).toBe(200);
    expect(contentExpansion.body.multiLanguageMicroNotes.supportedLanguages).toContain('Hindi');

    const mobile = await request(app).get('/api/v1/post-launch/mobile').set('Authorization', `Bearer ${studentToken}`);
    expect(mobile.status).toBe(200);
    expect(mobile.body.pushNotifications).toContain('streak-at-risk');

    const advancedAnalytics = await request(app)
      .get('/api/v1/post-launch/advanced-analytics')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(advancedAnalytics.status).toBe(200);
    expect(advancedAnalytics.body.neuroReviseLongTermRetentionTrend).toHaveLength(6);
    expect(advancedAnalytics.body.syllabusFlowPredictedCompletionDate).toBeTypeOf('string');
  });
});
