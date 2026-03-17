import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { env } from '../src/config/env.js';

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

describe('week 22 integration', () => {
  it('supports register-to-study-to-practice-to-revise-to-evaluate journey', async () => {
    const app = createApp();
    const email = `week22-${Date.now()}@example.com`;
    const password = 'SecurePass123!';

    const register = await request(app).post('/api/v1/auth/register').send({ email, password });
    expect(register.status).toBe(201);
    expect(register.body.verificationToken).toBeTypeOf('string');

    const verifyEmail = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: register.body.verificationToken as string });
    expect(verifyEmail.status).toBe(200);

    const login = await request(app).post('/api/v1/auth/login').send({ email, password });
    expect(login.status).toBe(200);
    const studentToken = login.body.tokens.accessToken as string;
    expect(studentToken).toBeTypeOf('string');

    const subjects = await request(app).get('/api/v1/subjects');
    expect(subjects.status).toBe(200);
    expect(subjects.body.length).toBeGreaterThan(0);

    const subjectId = subjects.body[0].id as string;
    const topics = await request(app).get(`/api/v1/subjects/${subjectId}/topics`);
    expect(topics.status).toBe(200);
    expect(topics.body.length).toBeGreaterThan(0);

    const topicId = topics.body[0].id as string;

    const markProgress = await request(app)
      .post(`/api/v1/progress/topic/${topicId}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ progressPercent: 100, completed: true });
    expect(markProgress.status).toBe(200);
    expect(markProgress.body.completed).toBe(true);

    const initialPracticeReady = await request(app)
      .get(`/api/v1/syllabus/topics/${topicId}/practice-ready`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(initialPracticeReady.status).toBe(200);
    expect(initialPracticeReady.body.practiceReady).toBe(false);

    const updateStatus = await request(app)
      .put(`/api/v1/syllabus/topics/${topicId}/status`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ status: 'completed', timeSpentMinutes: 45 });
    expect(updateStatus.status).toBe(200);
    expect(updateStatus.body.status).toBe('completed');

    const practiceReady = await request(app)
      .get(`/api/v1/syllabus/topics/${topicId}/practice-ready`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(practiceReady.status).toBe(200);
    expect(practiceReady.body.practiceReady).toBe(true);

    const dailyPractice = await request(app)
      .post('/api/v1/practice/daily/generate')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ questionCount: 3 });
    expect(dailyPractice.status).toBe(201);
    expect(dailyPractice.body.questions).toHaveLength(3);

    const test = await request(app)
      .post('/api/v1/tests/generate')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        type: 'topic_wise',
        topicIds: [topicId],
        questionCount: 3,
      });
    expect(test.status).toBe(201);

    const testSubmit = await request(app)
      .post(`/api/v1/tests/${test.body.testId as string}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        responses: (test.body.questions as Array<{ id: string }>).map((question) => ({
          questionId: question.id,
          selectedOption: 'A',
          timeTakenSeconds: 35,
        })),
      });
    expect(testSubmit.status).toBe(200);

    const gateStatus = await request(app)
      .get('/api/v1/mains/daily/gate-status')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(gateStatus.status).toBe(200);
    expect(gateStatus.body.isUnlocked).toBe(false);

    const adminOverride = await request(app)
      .post('/api/v1/mains/daily/override-gate')
      .set('Authorization', `Bearer ${issueAccessToken('admin', 'admin-week22-journey')}`)
      .send({
        userId: login.body.user.id as string,
        reason: 'Week 22 integrated flow validation',
      });
    expect(adminOverride.status).toBe(201);

    const mainsSubmission = await request(app)
      .post('/api/v1/mains/daily/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        answer:
          'Governance outcomes improve when institutions measure what matters, publish transparent metrics, and align incentives with citizen welfare.',
      });
    expect(mainsSubmission.status).toBe(201);

    const revisionDue = await request(app).get('/api/v1/revision/due').set('Authorization', `Bearer ${studentToken}`);
    expect(revisionDue.status).toBe(200);
    expect(Array.isArray(revisionDue.body)).toBe(true);

    const strategyToday = await request(app)
      .get('/api/v1/strategy/today')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(strategyToday.status).toBe(200);
    expect(strategyToday.body.tasks.some((task: { type: string }) => task.type === 'revision')).toBe(true);
    expect(strategyToday.body.tasks.some((task: { type: string }) => task.type === 'practice')).toBe(true);

    const secondBrainEntry = await request(app)
      .post('/api/v1/second-brain/entries')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Fiscal Federalism and Social Policy',
        content: 'Link welfare targeting with state finance incentives.',
        tags: ['economy', 'governance'],
        importance: 'high',
      });
    expect(secondBrainEntry.status).toBe(201);

    const secondBrainInsights = await request(app)
      .get('/api/v1/second-brain/insights/auto-generated')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(secondBrainInsights.status).toBe(200);
    expect(secondBrainInsights.body.length).toBeGreaterThan(0);

    const currentAffairs = await request(app)
      .get('/api/v1/current-affairs')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(currentAffairs.status).toBe(200);
    expect(currentAffairs.body.success).toBe(true);

  }, 30_000);

});
