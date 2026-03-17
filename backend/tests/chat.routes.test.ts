import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createChatRouter } from '../src/routes/chat.routes.js';
import { createKnowledgeGraphRouter } from '../src/routes/knowledge-graph.routes.js';
import { ChatService } from '../src/services/chat.service.js';
import { KnowledgeGraphService } from '../src/services/knowledge-graph.service.js';

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

  const knowledgeGraphService = new KnowledgeGraphService({ seedData: false });
  const chatService = new ChatService(knowledgeGraphService);
  app.use('/api/v1', createKnowledgeGraphRouter({ knowledgeGraphService }));
  app.use('/api/v1', createChatRouter({ chatService }));
  app.use(errorHandler);

  return app;
};

describe('chat routes', () => {
  it('creates session, sends message, gets history, lists sessions, and streams response', async () => {
    const app = createTestApp();
    const adminToken = issueAccessToken('admin');
    const studentToken = issueAccessToken('student', 'student-1');

    const subjectResponse = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Polity' });
    expect(subjectResponse.status).toBe(201);

    const topicResponse = await request(app)
      .post('/api/v1/topics')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ subjectId: subjectResponse.body.id, name: 'Federalism' });
    expect(topicResponse.status).toBe(201);

    await request(app)
      .post('/api/v1/content')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        topicId: topicResponse.body.id,
        type: 'concept',
        title: 'Division of powers',
        body: 'Union list and state list define responsibilities.',
      });

    const createSession = await request(app)
      .post('/api/v1/chat/session')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        mode: 'rapid_fire',
        subject: 'Polity',
        topic: 'Federalism',
      });

    expect(createSession.status).toBe(201);
    const sessionId = createSession.body.id;

    const fetchSession = await request(app)
      .get(`/api/v1/chat/session/${sessionId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(fetchSession.status).toBe(200);
    expect(fetchSession.body.id).toBe(sessionId);

    const askQuestion = await request(app)
      .post(`/api/v1/chat/session/${sessionId}/message`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'Ask 2 MCQs on Federalism' });
    expect(askQuestion.status).toBe(200);
    expect(askQuestion.body.response).toContain('Rapid Fire question');

    const streamResponse = await request(app)
      .post(`/api/v1/chat/session/${sessionId}/message/stream`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ message: 'A' });
    expect(streamResponse.status).toBe(200);
    expect(streamResponse.headers['content-type']).toContain('text/event-stream');
    expect(streamResponse.text).toContain('event: done');

    const listSessions = await request(app)
      .get('/api/v1/chat/sessions?limit=5')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(listSessions.status).toBe(200);
    expect(listSessions.body).toHaveLength(1);
  });
});
