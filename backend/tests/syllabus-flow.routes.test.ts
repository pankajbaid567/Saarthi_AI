import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createSyllabusFlowRouter } from '../src/routes/syllabus-flow.routes.js';
import { KnowledgeGraphService } from '../src/services/knowledge-graph.service.js';
import { SyllabusFlowService } from '../src/services/syllabus-flow.service.js';

const issueAccessToken = (): string => {
  return jwt.sign(
    {
      sub: 'student-user-id',
      role: 'student',
      email: 'student@example.com',
    },
    env.jwtAccessSecret,
    {
      expiresIn: env.accessTokenTtlSeconds,
    },
  );
};

const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const knowledgeGraphService = new KnowledgeGraphService({ seedData: false });
  const subject = knowledgeGraphService.createSubject({ name: 'History' });
  const topicOne = knowledgeGraphService.createTopic({ subjectId: subject.id, name: 'Modern India' });
  knowledgeGraphService.createTopic({ subjectId: subject.id, name: 'Ancient India' });
  const syllabusFlowService = new SyllabusFlowService({ knowledgeGraphService });

  app.use('/api/v1', createSyllabusFlowRouter({ syllabusFlowService }));
  app.use(errorHandler);

  return { app, subject, topicOne };
};

describe('syllabus flow routes', () => {
  it('supports syllabus progress and daily practice flows', async () => {
    const { app, subject, topicOne } = createTestApp();
    const token = issueAccessToken();

    const overallProgress = await request(app).get('/api/v1/syllabus/progress').set('Authorization', `Bearer ${token}`);
    expect(overallProgress.status).toBe(200);
    expect(overallProgress.body.subjects).toHaveLength(1);

    const updateStatus = await request(app)
      .put(`/api/v1/syllabus/topics/${topicOne.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed', timeSpentMinutes: 25 });
    expect(updateStatus.status).toBe(200);
    expect(updateStatus.body.status).toBe('completed');

    const practiceReady = await request(app)
      .get(`/api/v1/syllabus/topics/${topicOne.id}/practice-ready`)
      .set('Authorization', `Bearer ${token}`);
    expect(practiceReady.status).toBe(200);
    expect(practiceReady.body.practiceReady).toBe(true);

    const subjectProgress = await request(app)
      .get(`/api/v1/syllabus/progress/${subject.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(subjectProgress.status).toBe(200);
    expect(subjectProgress.body.subjectId).toBe(subject.id);

    const generated = await request(app)
      .post('/api/v1/practice/daily/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ questionCount: 3 });
    expect(generated.status).toBe(201);
    expect(generated.body.questions).toHaveLength(3);

    const queue = await request(app).get('/api/v1/practice/daily').set('Authorization', `Bearer ${token}`);
    expect(queue.status).toBe(200);
    expect(queue.body.questions).toHaveLength(3);

    for (const question of generated.body.questions as Array<{ questionId: string }>) {
      const submit = await request(app)
        .post(`/api/v1/practice/daily/${question.questionId}/submit`)
        .set('Authorization', `Bearer ${token}`)
        .send({ selectedOption: 'A' });
      expect(submit.status).toBe(200);
    }

    const results = await request(app).get('/api/v1/practice/daily/results').set('Authorization', `Bearer ${token}`);
    expect(results.status).toBe(200);
    expect(results.body.totalQuestions).toBe(3);

    const history = await request(app).get('/api/v1/practice/history').set('Authorization', `Bearer ${token}`);
    expect(history.status).toBe(200);
    expect(history.body).toHaveLength(1);

    const mixed = await request(app)
      .post('/api/v1/practice/mixed/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ questionCount: 2 });
    expect(mixed.status).toBe(201);
    expect(mixed.body.mode).toBe('mixed');
    expect(mixed.body.questions).toHaveLength(2);
  });
});
