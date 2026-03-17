import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createKnowledgeGraphRouter } from '../src/routes/knowledge-graph.routes.js';
import { KnowledgeGraphService } from '../src/services/knowledge-graph.service.js';

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
  app.use('/api/v1', createKnowledgeGraphRouter({ knowledgeGraphService }));
  app.use(errorHandler);

  return app;
};

describe('knowledge graph routes', () => {
  it('enforces admin writes and serves hierarchy reads', async () => {
    const app = createTestApp();
    const adminToken = issueAccessToken('admin');
    const studentToken = issueAccessToken('student');

    const forbiddenCreate = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'History' });

    expect(forbiddenCreate.status).toBe(403);

    const subjectResponse = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'History' });

    expect(subjectResponse.status).toBe(201);

    const topicResponse = await request(app)
      .post('/api/v1/topics')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ subjectId: subjectResponse.body.id, name: 'Ancient India' });

    expect(topicResponse.status).toBe(201);

    const subtopicResponse = await request(app)
      .post('/api/v1/topics')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        subjectId: subjectResponse.body.id,
        parentTopicId: topicResponse.body.id,
        name: 'Vedic Age',
      });

    expect(subtopicResponse.status).toBe(201);

    const contentResponse = await request(app)
      .post('/api/v1/content')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        topicId: topicResponse.body.id,
        type: 'concept',
        title: 'Ancient India overview',
        body: 'Covers Harappan civilization, Vedic period, and Mahajanapadas.',
      });

    expect(contentResponse.status).toBe(201);

    const subjectsList = await request(app).get('/api/v1/subjects');
    expect(subjectsList.status).toBe(200);
    expect(subjectsList.body).toHaveLength(1);

    const subjectTopics = await request(app).get(`/api/v1/subjects/${subjectResponse.body.id}/topics`);
    expect(subjectTopics.status).toBe(200);
    expect(subjectTopics.body).toHaveLength(2);

    const topicDetails = await request(app).get(`/api/v1/topics/${topicResponse.body.id}`);
    expect(topicDetails.status).toBe(200);
    expect(topicDetails.body.subtopics).toHaveLength(1);

    const subtopics = await request(app).get(`/api/v1/topics/${topicResponse.body.id}/subtopics`);
    expect(subtopics.status).toBe(200);
    expect(subtopics.body).toHaveLength(1);

    const topicContent = await request(app).get(`/api/v1/topics/${topicResponse.body.id}/content`);
    expect(topicContent.status).toBe(200);
    expect(topicContent.body).toHaveLength(1);

    const updateSubject = await request(app)
      .put(`/api/v1/subjects/${subjectResponse.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'History optional and GS foundation' });

    expect(updateSubject.status).toBe(200);

    const updateTopic = await request(app)
      .put(`/api/v1/topics/${subtopicResponse.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ parentTopicId: null, name: 'Vedic Civilization' });

    expect(updateTopic.status).toBe(200);

    const updateContent = await request(app)
      .put(`/api/v1/content/${contentResponse.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'highlight', body: 'Important chronology and cultural developments.' });

    expect(updateContent.status).toBe(200);

    const deleteContent = await request(app)
      .delete(`/api/v1/content/${contentResponse.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteContent.status).toBe(204);

    const deleteTopic = await request(app)
      .delete(`/api/v1/topics/${topicResponse.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteTopic.status).toBe(204);

    const deleteSubject = await request(app)
      .delete(`/api/v1/subjects/${subjectResponse.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(deleteSubject.status).toBe(204);
  });
});
