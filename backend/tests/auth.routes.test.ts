import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { env } from '../src/config/env.js';
import { AppError } from '../src/errors/app-error.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { createAuthRouter } from '../src/routes/auth.routes.js';
import {
  AuthService,
  type KeyValueStore,
  type SessionStore,
  type UserRole,
  type UserStore,
} from '../src/services/auth.service.js';

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

  async create(session: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    void session.userId;
    void session.expiresAt;
    this.sessions.set(session.id, { refreshTokenHash: session.refreshTokenHash });
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

const createTestApp = () => {
  const app = express();
  app.use(express.json());

  const authService = new AuthService({
    userStore: new MemoryUserStore(),
    sessionStore: new MemorySessionStore(),
    keyValueStore: new MemoryKeyValueStore(),
  });

  app.use('/api/v1/auth', createAuthRouter({ authService }));
  app.use(errorHandler);

  return app;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('auth routes', () => {
  it('supports register, verify, login, me, refresh, and logout flow', async () => {
    const app = createTestApp();

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'flow@example.com', password: 'Password@123' });

    expect(registerResponse.status).toBe(201);

    const verifyResponse = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: registerResponse.body.verificationToken });

    expect(verifyResponse.status).toBe(200);

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'flow@example.com', password: 'Password@123' });

    expect(loginResponse.status).toBe(200);

    const meResponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.tokens.accessToken}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.email).toBe('flow@example.com');

    const refreshResponse = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: loginResponse.body.tokens.refreshToken });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.refreshToken).not.toBe(loginResponse.body.tokens.refreshToken);

    const logoutResponse = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: refreshResponse.body.refreshToken });

    expect(logoutResponse.status).toBe(200);

    const invalidRefreshResponse = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: refreshResponse.body.refreshToken });

    expect(invalidRefreshResponse.status).toBe(401);
  });

  it('supports forgot and reset password flow', async () => {
    const app = createTestApp();

    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'reset-flow@example.com', password: 'Password@123' });

    await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: registerResponse.body.verificationToken });

    const forgotResponse = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'reset-flow@example.com' });

    expect(forgotResponse.status).toBe(200);

    const resetResponse = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({ token: forgotResponse.body.resetToken, password: 'NewPassword@123' });

    expect(resetResponse.status).toBe(200);

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'reset-flow@example.com', password: 'NewPassword@123' });

    expect(loginResponse.status).toBe(200);
  });

  it('supports google oauth endpoint integration flow', async () => {
    const app = createTestApp();
    const originalClientId = env.googleClientId;
    const originalClientSecret = env.googleClientSecret;
    const originalCallbackUrl = env.googleCallbackUrl;

    env.googleClientId = 'google-client-id';
    env.googleClientSecret = 'google-client-secret';
    env.googleCallbackUrl = 'http://localhost:3001/api/v1/auth/google/callback';

    const authRedirect = await request(app).get('/api/v1/auth/google');
    expect(authRedirect.status).toBe(302);

    const location = authRedirect.headers.location as string;
    const state = new URL(location).searchParams.get('state');

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'google-access-token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ email: 'google-flow@example.com' }),
        }),
    );

    const callback = await request(app).get('/api/v1/auth/google/callback').query({
      code: 'google-code',
      state,
    });

    expect(callback.status).toBe(200);
    expect(callback.body.user.email).toBe('google-flow@example.com');

    env.googleClientId = originalClientId;
    env.googleClientSecret = originalClientSecret;
    env.googleCallbackUrl = originalCallbackUrl;
  });
});
