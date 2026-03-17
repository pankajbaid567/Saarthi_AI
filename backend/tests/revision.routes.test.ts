import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createKnowledgeGraphRouter } from '../src/routes/knowledge-graph.routes.js';
import { createRevisionRouter } from '../src/routes/revision.routes.js';
import { KnowledgeGraphService } from '../src/services/knowledge-graph.service.js';
import { RevisionService } from '../src/services/revision.service.js';

const issueAccessToken = (role: 'student' | 'admin', userId = `${role}-user-id`): string => {
  return jwt.sign(
    {
      sub: userId,
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
  const revisionService = new RevisionService({ knowledgeGraphService });
  app.use('/api/v1', createKnowledgeGraphRouter({ knowledgeGraphService }));
  app.use('/api/v1', createRevisionRouter({ revisionService }));
  app.use(errorHandler);

  return app;
};

describe('revision routes', () => {
  it('supports NeuroRevise core endpoints for due cards, reviews, curves, retention and micro-notes', async () => {
    const app = createTestApp();
    const adminToken = issueAccessToken('admin');
    const studentToken = issueAccessToken('student', 'student-1');

    const subjectResponse = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'History' });
    expect(subjectResponse.status).toBe(201);

    const topicResponse = await request(app)
      .post('/api/v1/topics')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ subjectId: subjectResponse.body.id, name: 'Non-Cooperation Movement' });
    expect(topicResponse.status).toBe(201);

    await request(app)
      .post('/api/v1/content')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        topicId: topicResponse.body.id,
        type: 'concept',
        title: 'Overview',
        body: 'Launched in 1920. Boycott of institutions. Khilafat movement convergence.',
      });

    const generatedMicroNotes = await request(app)
      .post('/api/v1/revision/micro-notes/generate')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ topicId: topicResponse.body.id });
    expect(generatedMicroNotes.status).toBe(201);
    expect(generatedMicroNotes.body.notes).toHaveLength(3);

    const due = await request(app).get('/api/v1/revision/due').set('Authorization', `Bearer ${studentToken}`);
    expect(due.status).toBe(200);

    const dueByTier = await request(app)
      .get('/api/v1/revision/due')
      .set('Authorization', `Bearer ${studentToken}`)
      .query({ tier: '30sec' });
    expect(dueByTier.status).toBe(200);

    const review = await request(app)
      .post(`/api/v1/revision/${topicResponse.body.id}/review`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ recallQuality: 4 });
    expect(review.status).toBe(200);
    expect(review.body.nextReviewAt).toBeDefined();

    const dashboard = await request(app).get('/api/v1/revision/dashboard').set('Authorization', `Bearer ${studentToken}`);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.retentionHeatmap.length).toBeGreaterThan(0);

    const curve = await request(app)
      .get(`/api/v1/revision/forgetting-curve/${topicResponse.body.id}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(curve.status).toBe(200);
    expect(curve.body.points.length).toBeGreaterThan(0);

    const bulkCurve = await request(app)
      .get('/api/v1/revision/forgetting-curve/bulk')
      .query({ subjectId: subjectResponse.body.id })
      .set('Authorization', `Bearer ${studentToken}`);
    expect(bulkCurve.status).toBe(200);
    expect(bulkCurve.body.length).toBeGreaterThan(0);

    const retentionScores = await request(app)
      .get('/api/v1/revision/retention-scores')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(retentionScores.status).toBe(200);
    expect(retentionScores.body.length).toBeGreaterThan(0);

    const microNotes = await request(app)
      .get(`/api/v1/revision/micro-notes/${topicResponse.body.id}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(microNotes.status).toBe(200);
    expect(microNotes.body).toHaveLength(3);

    const updatedMicroNote = await request(app)
      .put(`/api/v1/revision/micro-notes/${microNotes.body[0].id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ content: '• 1920 launch\n• boycott\n• volunteer corps' });
    expect(updatedMicroNote.status).toBe(200);
    expect(updatedMicroNote.body.content).toContain('1920');
  });
});
