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
import { KnowledgeGraphService } from '../src/services/knowledge-graph.service.js';
import { MainsService } from '../src/services/mains.service.js';

const issueAccessToken = (role: 'student' | 'admin'): string => {
  return jwt.sign(
    {
      sub: `${role}-user-id`,
      role,
      email: `${role}@example.com`,
    },
    env.jwtAccessSecret,
    { expiresIn: env.accessTokenTtlSeconds },
    {
      expiresIn: env.accessTokenTtlSeconds,
    },
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
      `Body: Key challenges include implementation issues, but reforms and inclusive growth can improve outcomes.`,
      `Current affairs 2025 examples show why a flowchart and way forward are useful in the answer.`,
      `Conclusion: A balanced strategy with clear recommendations is required.`,
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
    expect(submitResponse.body.breakdown.keywords.present.length).toBeGreaterThan(0);
    expect(submitResponse.body.modelAnswer.length).toBeGreaterThan(0);

    const submissionsResponse = await request(app)
      .get('/api/v1/mains/submissions')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(submissionsResponse.status).toBe(200);
    expect(submissionsResponse.body.items).toHaveLength(1);
    expect(submissionsResponse.body.improvementByTopic.length).toBeGreaterThan(0);

    const submissionId = submitResponse.body.submissionId as string;
    const submissionDetailResponse = await request(app)
      .get(`/api/v1/mains/submissions/${submissionId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(submissionDetailResponse.status).toBe(200);
    expect(submissionDetailResponse.body.id).toBe(submissionId);
    expect(submissionDetailResponse.body.breakdown.content.maxScore).toBe(4);

    const missingSubmissionResponse = await request(app)
      .get('/api/v1/mains/submissions/4e31ce8c-a58d-4cf0-b909-ed6fa6f4f57e')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(missingSubmissionResponse.status).toBe(404);

  const knowledgeGraphService = new KnowledgeGraphService({ seedData: false });
  const subject = knowledgeGraphService.createSubject({ name: 'History' });
  const topic = knowledgeGraphService.createTopic({ subjectId: subject.id, name: 'Modern India' });
  const mainsService = new MainsService({ knowledgeGraphService, seedData: false });

  app.use('/api/v1', createMainsRouter({ mainsService }));
  app.use(errorHandler);

  return { app, topic };
};

describe('mains routes', () => {
  it('supports list, detail and admin create endpoints', async () => {
    const { app, topic } = createTestApp();
    const adminToken = issueAccessToken('admin');
    const studentToken = issueAccessToken('student');

    const studentCreateAttempt = await request(app)
      .post('/api/v1/mains/questions')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        topicId: topic.id,
        type: 'gs',
        source: 'pyq',
        marks: 10,
        questionText: 'Critically examine the role of socio-religious reform movements in India.',
        modelAnswer: 'An adequate answer covers causes, key reformers, and historical impact.',
        suggestedWordLimit: 250,
      });

    expect(studentCreateAttempt.status).toBe(403);

    const createResponse = await request(app)
      .post('/api/v1/mains/questions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        topicId: topic.id,
        type: 'gs',
        source: 'pyq',
        marks: 10,
        questionText: 'Critically examine the role of socio-religious reform movements in India.',
        modelAnswer: 'An adequate answer covers causes, key reformers, and historical impact.',
        suggestedWordLimit: 250,
        year: 2020,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.type).toBe('gs');
    expect(createResponse.body.source).toBe('pyq');
    const questionId = createResponse.body.id as string;

    const listResponse = await request(app)
      .get('/api/v1/mains/questions')
      .query({ topicId: topic.id, type: 'gs', marks: 10 })
      .set('Authorization', `Bearer ${studentToken}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.total).toBe(1);
    expect(listResponse.body.items).toHaveLength(1);
    expect(listResponse.body.items[0].id).toBe(questionId);

    const detailResponse = await request(app)
      .get(`/api/v1/mains/questions/${questionId}`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(detailResponse.status).toBe(200);
    expect(detailResponse.body.id).toBe(questionId);
    expect(detailResponse.body.questionText).toContain('socio-religious reform movements');
  });
});
