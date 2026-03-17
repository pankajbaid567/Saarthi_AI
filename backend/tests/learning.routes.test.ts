import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createKnowledgeGraphRouter } from '../src/routes/knowledge-graph.routes.js';
import { createLearningRouter } from '../src/routes/learning.routes.js';
import { KnowledgeGraphService } from '../src/services/knowledge-graph.service.js';
import { LearningService } from '../src/services/learning.service.js';

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
  const learningService = new LearningService({ knowledgeGraphService });
  app.use('/api/v1', createKnowledgeGraphRouter({ knowledgeGraphService }));
  app.use('/api/v1', createLearningRouter({ learningService }));
  app.use(errorHandler);

  return app;
};

describe('learning routes', () => {
  it('serves topic learning endpoints and user progress/highlights/bookmarks/search', async () => {
    const app = createTestApp();
    const adminToken = issueAccessToken('admin');
    const studentToken = issueAccessToken('student', 'student-1');

    const subjectResponse = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Geography' });
    expect(subjectResponse.status).toBe(201);

    const topicResponse = await request(app)
      .post('/api/v1/topics')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ subjectId: subjectResponse.body.id, name: 'Monsoon' });
    expect(topicResponse.status).toBe(201);
    const relatedTopicResponse = await request(app)
      .post('/api/v1/topics')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ subjectId: subjectResponse.body.id, name: 'Climate Dynamics' });
    expect(relatedTopicResponse.status).toBe(201);

    await request(app)
      .post('/api/v1/content')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        topicId: topicResponse.body.id,
        type: 'concept',
        title: 'Concept Notes',
        body: '# Monsoon\nMarkdown note content',
      });

    const pyqResponse = await request(app)
      .post('/api/v1/content')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        topicId: topicResponse.body.id,
        type: 'pyq',
        title: 'PYQ 2020',
        body: 'Monsoon onset question',
      });

    await request(app)
      .post('/api/v1/content')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        topicId: topicResponse.body.id,
        type: 'highlight',
        title: 'Smart Highlight',
        body: 'ITCZ shift is important',
      });

    await request(app)
      .post('/api/v1/content')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        topicId: topicResponse.body.id,
        type: 'micro_note',
        title: 'Micro',
        body: 'SW monsoon + NE monsoon',
      });

    await request(app)
      .post('/api/v1/content')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        topicId: relatedTopicResponse.body.id,
        type: 'fact',
        title: 'Monsoon circulation',
        body: 'Monsoon wind reversal is governed by seasonal pressure shifts.',
      });

    const notes = await request(app).get(`/api/v1/topics/${topicResponse.body.id}/notes`);
    expect(notes.status).toBe(200);
    expect(notes.body).toHaveLength(1);

    const pyqs = await request(app).get(`/api/v1/topics/${topicResponse.body.id}/pyqs`);
    expect(pyqs.status).toBe(200);
    expect(pyqs.body).toHaveLength(1);

    const smartHighlights = await request(app).get(`/api/v1/topics/${topicResponse.body.id}/highlights`);
    expect(smartHighlights.status).toBe(200);
    expect(smartHighlights.body).toHaveLength(1);

    const microNotes = await request(app).get(`/api/v1/topics/${topicResponse.body.id}/micro-notes`);
    expect(microNotes.status).toBe(200);
    expect(microNotes.body).toHaveLength(1);

    const progress = await request(app)
      .post(`/api/v1/progress/topic/${topicResponse.body.id}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ progressPercent: 80 });
    expect(progress.status).toBe(200);
    expect(progress.body.progressPercent).toBe(80);

    const overallProgress = await request(app)
      .get('/api/v1/progress')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(overallProgress.status).toBe(200);
    expect(overallProgress.body.items).toHaveLength(1);

    const userHighlight = await request(app)
      .post('/api/v1/user/highlights')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        topicId: topicResponse.body.id,
        contentNodeId: pyqResponse.body.id,
        highlightedText: 'onset over Kerala',
      });
    expect(userHighlight.status).toBe(201);

    const userHighlightList = await request(app)
      .get('/api/v1/user/highlights')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(userHighlightList.status).toBe(200);
    expect(userHighlightList.body).toHaveLength(1);

    const userBookmark = await request(app)
      .post('/api/v1/user/bookmarks')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        topicId: topicResponse.body.id,
        contentNodeId: pyqResponse.body.id,
        title: 'Revise monsoon PYQ',
      });
    expect(userBookmark.status).toBe(201);

    const bookmarkList = await request(app)
      .get('/api/v1/user/bookmarks')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(bookmarkList.status).toBe(200);
    expect(bookmarkList.body).toHaveLength(1);

    const search = await request(app).get('/api/v1/content/search').query({
      q: 'Monsoon',
      type: 'pyq',
      subject: 'Geography',
      includeContext: true,
    });
    expect(search.status).toBe(200);
    expect(search.body.results.length).toBeGreaterThan(0);
    expect(search.body.rag.sources.length).toBeGreaterThan(0);

    const relatedContent = await request(app).get(`/api/v1/topics/${topicResponse.body.id}/related-content`);
    expect(relatedContent.status).toBe(200);
    expect(Array.isArray(relatedContent.body)).toBe(true);

    const deleteHighlight = await request(app)
      .delete(`/api/v1/user/highlights/${userHighlight.body.id}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(deleteHighlight.status).toBe(204);

    const deleteBookmark = await request(app)
      .delete(`/api/v1/user/bookmarks/${userBookmark.body.id}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(deleteBookmark.status).toBe(204);
  });
});
