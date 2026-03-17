import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createTestsRouter } from '../src/routes/tests.routes.js';
import { KnowledgeGraphService } from '../src/services/knowledge-graph.service.js';
import { TestEngineService } from '../src/services/test-engine.service.js';

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
  const topic = knowledgeGraphService.createTopic({ subjectId: subject.id, name: 'Modern India' });
  knowledgeGraphService.createTopic({ subjectId: subject.id, parentTopicId: topic.id, name: 'Revolt of 1857' });
  const testEngineService = new TestEngineService({ knowledgeGraphService });

  app.use('/api/v1', createTestsRouter({ testEngineService }));
  app.use(errorHandler);

  return { app, topic };
};

describe('tests routes', () => {
  it('supports generate, retrieval, submit, results and history endpoints', async () => {
    const { app, topic } = createTestApp();
    const token = issueAccessToken();

    const generateResponse = await request(app)
      .post('/api/v1/tests/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'topic_wise',
        topicIds: [topic.id],
        questionCount: 3,
      });

    expect(generateResponse.status).toBe(201);
    expect(generateResponse.body.questions).toHaveLength(3);
    const testId = generateResponse.body.testId as string;

    const getActiveTest = await request(app)
      .get(`/api/v1/tests/${testId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getActiveTest.status).toBe(200);
    expect(getActiveTest.body.status).toBe('active');

    const submitResponse = await request(app)
      .post(`/api/v1/tests/${testId}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        responses: [
          {
            questionId: generateResponse.body.questions[0].id,
            selectedOption: 'A',
            timeTakenSeconds: 42,
          },
          {
            questionId: generateResponse.body.questions[1].id,
            selectedOption: 'D',
            timeTakenSeconds: 35,
            isFlagged: true,
          },
        ],
      });

    expect(submitResponse.status).toBe(200);
    expect(submitResponse.body).toHaveProperty('negativeMarks');

    const resultsResponse = await request(app)
      .get(`/api/v1/tests/${testId}/results`)
      .set('Authorization', `Bearer ${token}`);
    expect(resultsResponse.status).toBe(200);
    expect(resultsResponse.body.questions).toHaveLength(3);

    const historyResponse = await request(app)
      .get('/api/v1/tests/history')
      .set('Authorization', `Bearer ${token}`);
    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body).toHaveLength(1);
  });
});
