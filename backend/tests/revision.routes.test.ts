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

const issueAccessToken = (): string => {
  return jwt.sign(
    {
      sub: 'student-user-id',
      role: 'student',
      email: 'student@example.com',
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
  const polity = knowledgeGraphService.createSubject({ name: 'Polity' });
  const topicOne = knowledgeGraphService.createTopic({ subjectId: polity.id, name: 'Fundamental Rights' });
  const topicTwo = knowledgeGraphService.createTopic({ subjectId: polity.id, name: 'DPSP' });
  knowledgeGraphService.createContentNode({
    topicId: topicOne.id,
    type: 'concept',
    title: 'FR Note',
    body: 'Equality and liberty framework under Part III.',
  });

  const revisionService = new RevisionService({ knowledgeGraphService });

  app.use('/api/v1', createRevisionRouter({ revisionService }));
  app.use(errorHandler);

  return { app, topicOne, topicTwo };
};

describe('revision routes', () => {
  it('supports active recall, sprint, flashcards, predictions, and streak endpoints', async () => {
    const { app, topicOne, topicTwo } = createTestApp();
    const token = issueAccessToken();

    const startRecall = await request(app)
      .post('/api/v1/revision/active-recall/start')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topicIds: [topicOne.id, topicTwo.id],
        questionCount: 4,
      });
    expect(startRecall.status).toBe(201);
    expect(startRecall.body.data.questions).toHaveLength(4);

    const sessionId = startRecall.body.data.sessionId as string;
    const questionId = startRecall.body.data.questions[0].id as string;

    const answerRecall = await request(app)
      .post(`/api/v1/revision/active-recall/${sessionId}/answer`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        questionId,
        userAnswer: 'Article 14 provides equality before law while Article 15 handles discrimination grounds.',
        confidenceLevel: 4,
      });
    expect(answerRecall.status).toBe(200);
    expect(answerRecall.body.data.score).toBeGreaterThanOrEqual(0);

    const recallResults = await request(app)
      .get(`/api/v1/revision/active-recall/${sessionId}/results`)
      .set('Authorization', `Bearer ${token}`);
    expect(recallResults.status).toBe(200);
    expect(recallResults.body.data.totalQuestions).toBe(4);
    expect(recallResults.body.data.results).toHaveLength(4);

    const startSprint = await request(app)
      .post('/api/v1/revision/sprint/start')
      .set('Authorization', `Bearer ${token}`)
      .send({
        durationMinutes: 30,
        crashMode: true,
        daysRemaining: 12,
      });
    expect(startSprint.status).toBe(201);
    expect(startSprint.body.data.crashMode).toBe(true);
    expect(startSprint.body.data.acceleratedScheduling).toBe(true);
    expect(startSprint.body.data.totalTopics).toBeGreaterThan(0);

    const sprintId = startSprint.body.data.sprintId as string;
    const completeSprint = await request(app)
      .post(`/api/v1/revision/sprint/${sprintId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        completedTopicIds: [topicOne.id],
      });
    expect(completeSprint.status).toBe(200);
    expect(completeSprint.body.data.completionRate).toBeGreaterThan(0);

    const sprintHistory = await request(app)
      .get('/api/v1/revision/sprint/history')
      .set('Authorization', `Bearer ${token}`);
    expect(sprintHistory.status).toBe(200);
    expect(sprintHistory.body.data).toHaveLength(1);

    const createFlashcard = await request(app)
      .post('/api/v1/revision/flashcards')
      .set('Authorization', `Bearer ${token}`)
      .send({
        topicId: topicOne.id,
        front: 'Differentiate Article 14 and 15',
        back: 'Article 14 is broad equality while Article 15 is non-discrimination on specific grounds.',
      });
    expect(createFlashcard.status).toBe(201);
    expect(createFlashcard.body.data.source).toBe('manual');

    const listFlashcards = await request(app)
      .get('/api/v1/revision/flashcards')
      .query({ due: 'true', limit: 20 })
      .set('Authorization', `Bearer ${token}`);
    expect(listFlashcards.status).toBe(200);
    expect(listFlashcards.body.data.length).toBeGreaterThan(0);

    const predictions = await request(app)
      .get('/api/v1/revision/predictions')
      .set('Authorization', `Bearer ${token}`);
    expect(predictions.status).toBe(200);
    expect(Array.isArray(predictions.body.data.alerts)).toBe(true);

    const streaks = await request(app)
      .get('/api/v1/revision/streaks')
      .set('Authorization', `Bearer ${token}`);
    expect(streaks.status).toBe(200);
    expect(streaks.body.data.current).toBeGreaterThan(0);
    expect(streaks.body.data.graceDaysRemaining).toBeGreaterThanOrEqual(0);
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
