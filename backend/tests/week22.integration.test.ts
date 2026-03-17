import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { env } from '../src/config/env.js';
import { AppError } from '../src/errors/app-error.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createAuthRouter } from '../src/routes/auth.routes.js';
import { createKnowledgeGraphRouter } from '../src/routes/knowledge-graph.routes.js';
import { createLearningRouter } from '../src/routes/learning.routes.js';
import { createTestsRouter } from '../src/routes/tests.routes.js';
import {
  AuthService,
  type KeyValueStore,
  type SessionStore,
  type UserRole,
  type UserStore,
} from '../src/services/auth.service.js';
import { KnowledgeGraphService } from '../src/services/knowledge-graph.service.js';
import { LearningService } from '../src/services/learning.service.js';
import { TestEngineService } from '../src/services/test-engine.service.js';

type MemoryUser = {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

class MemoryUserStore implements UserStore {
  private readonly users = new Map<string, MemoryUser>();

  async findByEmail(email: string): Promise<MemoryUser | null> {
    return [...this.users.values()].find((item) => item.email === email) ?? null;
  }

  async findById(id: string): Promise<MemoryUser | null> {
    return this.users.get(id) ?? null;
  }

  async create(input: { email: string; passwordHash: string; role?: UserRole }): Promise<MemoryUser> {
    const now = new Date();
    const user: MemoryUser = {
      id: `user-${this.users.size + 1}`,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role ?? 'student',
      createdAt: now,
      updatedAt: now,
    };

    this.users.set(user.id, user);
    return user;
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    const user = this.users.get(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.passwordHash = passwordHash;
    user.updatedAt = new Date();
  }
}

class MemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, { refreshTokenHash: string }>();

  async create({
    id,
    refreshTokenHash,
  }: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    this.sessions.set(id, { refreshTokenHash });
  }

  async updateRefreshTokenHash(sessionId: string, refreshTokenHash: string): Promise<void> {
    this.sessions.set(sessionId, { refreshTokenHash });
  }

  async deleteById(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}

class MemoryKeyValueStore implements KeyValueStore {
  private readonly values = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async del(key: string): Promise<void> {
    this.values.delete(key);
  }
}

const issueAdminToken = (): string => {
  return jwt.sign(
    {
      sub: 'week22-admin-user-id',
      role: 'admin',
      email: 'admin@example.com',
    },
    env.jwtAccessSecret,
    {
      expiresIn: env.accessTokenTtlSeconds,
    },
  );
};

const createWeek22TestApp = () => {
  const app = express();
  app.use(express.json());

  const authService = new AuthService({
    userStore: new MemoryUserStore(),
    sessionStore: new MemorySessionStore(),
    keyValueStore: new MemoryKeyValueStore(),
  });
  const knowledgeGraphService = new KnowledgeGraphService({ seedData: false });
  const fixtureSubject = knowledgeGraphService.createSubject({ name: 'Week 22 Fixture Subject' });
  knowledgeGraphService.createTopic({ subjectId: fixtureSubject.id, name: 'Week 22 Fixture Topic 1' });
  knowledgeGraphService.createTopic({ subjectId: fixtureSubject.id, name: 'Week 22 Fixture Topic 2' });
  const learningService = new LearningService({ knowledgeGraphService });
  const testEngineService = new TestEngineService({ knowledgeGraphService });

  app.use('/api/v1/auth', createAuthRouter({ authService }));
  app.use('/api/v1', createKnowledgeGraphRouter({ knowledgeGraphService }));
  app.use('/api/v1', createLearningRouter({ learningService }));
  app.use('/api/v1', createTestsRouter({ testEngineService }));
  app.use(errorHandler);

  return app;
};

const registerAndLogin = async (app: express.Express, email: string) => {
  const registerResponse = await request(app).post('/api/v1/auth/register').send({ email, password: 'Password@123' });
  expect(registerResponse.status).toBe(201);

  const verifyResponse = await request(app)
    .post('/api/v1/auth/verify-email')
    .send({ token: registerResponse.body.verificationToken });
  expect(verifyResponse.status).toBe(200);

  const loginResponse = await request(app).post('/api/v1/auth/login').send({ email, password: 'Password@123' });
  expect(loginResponse.status).toBe(200);

  return {
    accessToken: loginResponse.body.tokens.accessToken as string,
  };
};

describe('week 22 integration journey', () => {
  it('supports register → study progress → practice generation → submission → evaluation results', async () => {
    const app = createWeek22TestApp();
    const adminToken = issueAdminToken();
    const studentAuth = await registerAndLogin(app, 'week22-student@example.com');

    const subjectResponse = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Week 22 Subject' });
    expect(subjectResponse.status).toBe(201);

    const topicResponse = await request(app)
      .post('/api/v1/topics')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ subjectId: subjectResponse.body.id, name: 'Week 22 Topic' });
    expect(topicResponse.status).toBe(201);

    const progressResponse = await request(app)
      .post(`/api/v1/progress/topic/${topicResponse.body.id}`)
      .set('Authorization', `Bearer ${studentAuth.accessToken}`)
      .send({ progressPercent: 75 });
    expect(progressResponse.status).toBe(200);
    expect(progressResponse.body.progressPercent).toBe(75);

    const generateResponse = await request(app)
      .post('/api/v1/tests/generate')
      .set('Authorization', `Bearer ${studentAuth.accessToken}`)
      .send({
        type: 'mixed',
        questionCount: 3,
      });
    expect(generateResponse.status).toBe(201);
    expect(generateResponse.body.questions).toHaveLength(3);

    const submitResponse = await request(app)
      .post(`/api/v1/tests/${generateResponse.body.testId}/submit`)
      .set('Authorization', `Bearer ${studentAuth.accessToken}`)
      .send({
        responses: generateResponse.body.questions.slice(0, 2).map((question: { id: string }, index: number) => ({
          questionId: question.id,
          selectedOption: index === 0 ? 'A' : 'B',
          timeTakenSeconds: 25 + index,
        })),
      });
    expect(submitResponse.status).toBe(200);
    expect(submitResponse.body).toHaveProperty('score');

    const resultsResponse = await request(app)
      .get(`/api/v1/tests/${generateResponse.body.testId}/results`)
      .set('Authorization', `Bearer ${studentAuth.accessToken}`);
    expect(resultsResponse.status).toBe(200);
    expect(resultsResponse.body.questions).toHaveLength(3);
  });

  it('prevents students from creating knowledge graph items (cross-module edge case)', async () => {
    const app = createWeek22TestApp();
    const studentAuth = await registerAndLogin(app, 'week22-student-2@example.com');

    const subjectResponse = await request(app)
      .post('/api/v1/subjects')
      .set('Authorization', `Bearer ${studentAuth.accessToken}`)
      .send({ name: 'Unauthorized Subject' });

    expect(subjectResponse.status).toBe(403);
  });
});
