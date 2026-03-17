import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createMainsRouter } from '../src/routes/mains.routes.js';
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
