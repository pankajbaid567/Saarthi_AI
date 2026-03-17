import { describe, expect, it } from 'vitest';

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
    const user = [...this.users.values()].find((item) => item.email === email) ?? null;
    return user;
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
      return;
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
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, { refreshTokenHash });
      return;
    }

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

const createAuthService = (): AuthService => {
  return new AuthService({
    userStore: new MemoryUserStore(),
    sessionStore: new MemorySessionStore(),
    keyValueStore: new MemoryKeyValueStore(),
  });
};

describe('auth service', () => {
  it('registers user, verifies email, and issues tokens on login', async () => {
    const authService = createAuthService();
    const registerResult = await authService.register({
      email: 'student@example.com',
      password: 'Password@123',
    });

    expect(registerResult.user.email).toBe('student@example.com');
    expect(registerResult.verificationToken).toBeDefined();

    await expect(
      authService.login({ email: 'student@example.com', password: 'Password@123' }),
    ).rejects.toThrowError('Email not verified');

    await authService.verifyEmail(registerResult.verificationToken as string);

    const loginResult = await authService.login({
      email: 'student@example.com',
      password: 'Password@123',
    });

    expect(loginResult.tokens.accessToken).toBeTruthy();
    expect(loginResult.tokens.refreshToken).toBeTruthy();
  });

  it('rotates refresh tokens and invalidates old token', async () => {
    const authService = createAuthService();
    const registerResult = await authService.register({
      email: 'refresh@example.com',
      password: 'Password@123',
    });

    await authService.verifyEmail(registerResult.verificationToken as string);

    const loginResult = await authService.login({
      email: 'refresh@example.com',
      password: 'Password@123',
    });

    const refreshed = await authService.refresh(loginResult.tokens.refreshToken);

    expect(refreshed.refreshToken).not.toBe(loginResult.tokens.refreshToken);

    await expect(authService.refresh(loginResult.tokens.refreshToken)).rejects.toThrowError(
      'Invalid refresh token',
    );
  });

  it('supports forgot and reset password flow', async () => {
    const authService = createAuthService();
    const registerResult = await authService.register({
      email: 'reset@example.com',
      password: 'Password@123',
    });

    await authService.verifyEmail(registerResult.verificationToken as string);

    const forgotResult = await authService.forgotPassword('reset@example.com');
    expect(forgotResult.resetToken).toBeDefined();

    await authService.resetPassword({
      token: forgotResult.resetToken as string,
      password: 'NewPassword@123',
    });

    const loginResult = await authService.login({
      email: 'reset@example.com',
      password: 'NewPassword@123',
    });

    expect(loginResult.tokens.accessToken).toBeTruthy();

    await expect(authService.login({ email: 'reset@example.com', password: 'Password@123' })).rejects.toThrow(
      'Invalid email or password',
    );
  });

  it('creates verified users through google oauth login', async () => {
    const authService = createAuthService();

    const oauthResult = await authService.googleOAuthLogin({
      email: 'google@example.com',
    });

    expect(oauthResult.user.email).toBe('google@example.com');

    const forgotResult = await authService.forgotPassword('google@example.com');
    expect(forgotResult.resetToken).toBeDefined();
  });
});
