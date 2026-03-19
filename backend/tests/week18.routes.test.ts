import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createEssaysRouter } from '../src/routes/essays.routes.js';
import { createKnowledgeGraphRouter } from '../src/routes/knowledge-graph.routes.js';
import { createMainsRouter } from '../src/routes/mains.routes.js';
import { createPracticeRouter } from '../src/routes/practice.routes.js';
import { createTestsRouter } from '../src/routes/tests.routes.js';
import { createFeedbackLoopService } from '../src/services/feedback-loop.service.js';
import { KnowledgeGraphService } from '../src/services/knowledge-graph.service.js';
import { createMainsService } from '../src/services/mains.service.js';
import { TestEngineService } from '../src/services/test-engine.service.js';

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
  const subject = knowledgeGraphService.createSubject({ name: 'Polity' });
  const topic = knowledgeGraphService.createTopic({ subjectId: subject.id, name: 'Parliament' });

  const testEngineService = new TestEngineService({ knowledgeGraphService });
  const mainsService = createMainsService({ testEngineService, requiredDailyMcqAttempts: 3 });
  const feedbackLoopService = createFeedbackLoopService({ testEngineService });

  app.use('/api/v1', createKnowledgeGraphRouter({ knowledgeGraphService }));
  app.use('/api/v1', createTestsRouter({ testEngineService }));
  app.use('/api/v1', createMainsRouter({ mainsService }));
  app.use('/api/v1', createEssaysRouter());
  app.use('/api/v1', createPracticeRouter({ feedbackLoopService }));
  app.use(errorHandler);

  return { app, topic };
};

describe('week 18 routes', () => {
  it('supports mains gating, essays, and feedback loop endpoints', async () => {
    const { app, topic } = createTestApp();
    const studentId = '11111111-1111-4111-8111-111111111111';
    const adminId = '22222222-2222-4222-8222-222222222222';
    const studentToken = issueAccessToken('student', studentId);
    const adminToken = issueAccessToken('admin', adminId);

    const initialGateStatus = await request(app)
      .get('/api/v1/mains/daily/gate-status')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(initialGateStatus.status).toBe(200);
    expect(initialGateStatus.body.isUnlocked ?? initialGateStatus.body.unlocked ?? false).toBe(false);

    const lockedQuestion = await request(app)
      .get('/api/v1/mains/daily/question')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(lockedQuestion.status).toBe(200);
    expect(lockedQuestion.body.question).toBeNull();

    const generateResponse = await request(app)
      .post('/api/v1/tests/generate')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        type: 'topic_wise',
        topicIds: [topic.id],
        questionCount: 3,
      });
    expect(generateResponse.status).toBe(201);

    const submitResponse = await request(app)
      .post(`/api/v1/tests/${generateResponse.body.testId as string}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        responses: (generateResponse.body.questions as Array<{ id: string }>).map((question) => ({
          questionId: question.id,
          selectedOption: 'A',
          timeTakenSeconds: 30,
        })),
      });
    expect(submitResponse.status).toBe(200);

    const unlockedGateStatus = await request(app)
      .get('/api/v1/mains/daily/gate-status')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(unlockedGateStatus.status).toBe(200);
    expect(unlockedGateStatus.body.isUnlocked).toBe(true);

    const mainsSubmission = await request(app)
      .post('/api/v1/mains/daily/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        answer:
          'India needs accountable institutions with transparent outcomes. For example, social audits and parliamentary committees increase public trust and improve implementation quality. Therefore, accountability and efficiency must move together.',
      });
    expect(mainsSubmission.status).toBe(201);

    const essayQuestion = await request(app)
      .get('/api/v1/essays/weekly/question')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(essayQuestion.status).toBe(200);
    expect(essayQuestion.body.prompt).toBeTypeOf('string');

    const essaySubmit = await request(app)
      .post('/api/v1/essays/weekly/submit')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        answer:
          'Ethics in technology-led governance depends on intent and institutions. For example, transparency portals reduce discretion and improve accountability. A balanced policy architecture must combine rights, safeguards, and measurable service outcomes. To conclude, ethical public systems are designed, not assumed.',
      });
    expect(essaySubmit.status).toBe(201);
    expect(essaySubmit.body.evaluation).toHaveProperty('totalScore');

    const essaySubmissions = await request(app)
      .get('/api/v1/essays/submissions')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(essaySubmissions.status).toBe(200);
    expect(essaySubmissions.body).toHaveLength(1);

    const feedbackLoop = await request(app)
      .get('/api/v1/practice/feedback-loop')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(feedbackLoop.status).toBe(200);
    expect(feedbackLoop.body.topics.length).toBeGreaterThan(0);

    const nonRepetitionStats = await request(app)
      .get('/api/v1/practice/non-repetition/stats')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(nonRepetitionStats.status).toBe(200);
    expect(nonRepetitionStats.body).toHaveProperty('repetitionRate');

    const overrideDenied = await request(app)
      .post('/api/v1/mains/daily/override-gate')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ reason: 'Need to practice mains today' });
    expect(overrideDenied.status).toBe(403);

    const overrideAccepted = await request(app)
      .post('/api/v1/mains/daily/override-gate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId: studentId, reason: 'Manual review approved by mentor' });
    expect(overrideAccepted.status).toBe(201);
    expect(overrideAccepted.body.reason).toContain('mentor');
  });
});
