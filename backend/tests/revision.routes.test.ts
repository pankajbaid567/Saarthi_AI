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
  it('supports active recall, sprint, flashcards, predictions, and streak endpoints', async () => {
    const app = createTestApp();
    const adminToken = issueAccessToken('admin');
    const studentToken = issueAccessToken('student', 'student-1');

    const subjectResponse = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Polity' });
    expect(subjectResponse.status).toBe(201);

    const topicOne = await request(app)
      .post('/api/v1/topics')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ subjectId: subjectResponse.body.id, name: 'Fundamental Rights' });
    const topicTwo = await request(app)
      .post('/api/v1/topics')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ subjectId: subjectResponse.body.id, name: 'DPSP' });

    const startRecall = await request(app)
      .post('/api/v1/revision/active-recall/start')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        topicIds: [topicOne.body.id, topicTwo.body.id],
        questionCount: 4,
      });
    expect(startRecall.status).toBe(201);
    expect(startRecall.body.data.questions).toHaveLength(4);

    const sessionId = startRecall.body.data.sessionId as string;
    const questionId = startRecall.body.data.questions[0].id as string;

    const answerRecall = await request(app)
      .post(`/api/v1/revision/active-recall/${sessionId}/answer`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        questionId,
        userAnswer: 'Article 14 provides equality before law while Article 15 handles discrimination grounds.',
        confidenceLevel: 4,
      });
    expect(answerRecall.status).toBe(200);

    const startSprint = await request(app)
      .post('/api/v1/revision/sprint/start')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ durationMinutes: 30, crashMode: true, daysRemaining: 12 });
    expect(startSprint.status).toBe(201);

    const sprintId = startSprint.body.data.sprintId as string;
    const completeSprint = await request(app)
      .post(`/api/v1/revision/sprint/${sprintId}/complete`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ completedTopicIds: [topicOne.body.id] });
    expect(completeSprint.status).toBe(200);

    const createFlashcard = await request(app)
      .post('/api/v1/revision/flashcards')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        topicId: topicOne.body.id,
        front: 'Differentiate Article 14 and 15',
        back: 'Article 14 is broad equality while Article 15 is non-discrimination on specific grounds.',
      });
    expect(createFlashcard.status).toBe(201);

    const predictions = await request(app)
      .get('/api/v1/revision/predictions')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(predictions.status).toBe(200);
    expect(Array.isArray(predictions.body.data.alerts)).toBe(true);

    const streaks = await request(app)
      .get('/api/v1/revision/streaks')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(streaks.status).toBe(200);
    expect(streaks.body.data.current).toBeGreaterThan(0);
  });

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

    const review = await request(app)
      .post(`/api/v1/revision/${topicResponse.body.id}/review`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ recallQuality: 4 });
    expect(review.status).toBe(200);

    const curve = await request(app)
      .get(`/api/v1/revision/forgetting-curve/${topicResponse.body.id}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(curve.status).toBe(200);

    const retentionScores = await request(app)
      .get('/api/v1/revision/retention-scores')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(retentionScores.status).toBe(200);

    const microNotes = await request(app)
      .get(`/api/v1/revision/micro-notes/${topicResponse.body.id}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(microNotes.status).toBe(200);
    expect(microNotes.body).toHaveLength(3);
  });
});
