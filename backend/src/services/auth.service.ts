import bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { prisma } from '../lib/prisma.js';
import { redisClient } from '../lib/redis.js';
import { logger } from '../utils/logger.js';

export type UserRole = 'student' | 'admin' | 'content_manager';

export type AuthUser = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

type PersistedUser = AuthUser & {
  passwordHash: string;
};

type SessionRecord = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

type RegisterResult = {
  user: AuthUser;
  verificationToken?: string;
};

type PasswordResetResult = {
  message: string;
  resetToken?: string;
};

export interface UserStore {
  findByEmail(email: string): Promise<PersistedUser | null>;
  findById(id: string): Promise<PersistedUser | null>;
  create(input: { email: string; passwordHash: string; role?: UserRole }): Promise<PersistedUser>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}

export interface SessionStore {
  create(session: SessionRecord): Promise<void>;
  updateRefreshTokenHash(sessionId: string, refreshTokenHash: string): Promise<void>;
  deleteById(sessionId: string): Promise<void>;
}

export interface KeyValueStore {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
}

class PrismaUserStore implements UserStore {
  async findByEmail(email: string): Promise<PersistedUser | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? (user as unknown as PersistedUser) : null;
  }

  async findById(id: string): Promise<PersistedUser | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? (user as unknown as PersistedUser) : null;
  }

  async create(input: { email: string; passwordHash: string; role?: UserRole }): Promise<PersistedUser> {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role as any,
      },
    });
    return user as unknown as PersistedUser;
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }
}

class PrismaSessionStore implements SessionStore {
  async create(session: SessionRecord): Promise<void> {
    await prisma.session.create({
      data: {
        id: session.id,
        userId: session.userId,
        refreshToken: session.refreshTokenHash,
        expiresAt: session.expiresAt,
      },
    });
  }

  async updateRefreshTokenHash(sessionId: string, refreshTokenHash: string): Promise<void> {
    await prisma.session.update({
      where: { id: sessionId },
      data: { refreshToken: refreshTokenHash },
    });
  }

  async deleteById(sessionId: string): Promise<void> {
    try {
      await prisma.session.delete({ where: { id: sessionId } });
    } catch {
      // Ignored
    }
  }
}

class RedisKeyValueStore implements KeyValueStore {
  private readonly fallbackValues = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    try {
      const value = await redisClient.get(key);
      return value ?? this.fallbackValues.get(key) ?? null;
    } catch {
      return this.fallbackValues.get(key) ?? null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    this.fallbackValues.set(key, value);

    try {
      if (ttlSeconds && ttlSeconds > 0) {
        await redisClient.set(key, value, 'EX', ttlSeconds);
        return;
      }

      await redisClient.set(key, value);
    } catch {
      logger.warn('Redis unavailable for key-value set operation', { key });
    }
  }

  async del(key: string): Promise<void> {
    this.fallbackValues.delete(key);
    try {
      await redisClient.del(key);
    } catch {
      logger.warn('Redis unavailable for key-value delete operation', { key });
    }
  }
}

export type AuthServiceDependencies = {
  userStore?: UserStore;
  sessionStore?: SessionStore;
  keyValueStore?: KeyValueStore;
};

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

const randomToken = (): string => randomBytes(32).toString('hex');

const toPublicUser = (user: PersistedUser): AuthUser => ({
  id: user.id,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const defaultUserStore = new PrismaUserStore();
const defaultSessionStore = new PrismaSessionStore();
const defaultKeyValueStore = new RedisKeyValueStore();

export class AuthService {
  private readonly userStore: UserStore;

  private readonly sessionStore: SessionStore;

  private readonly keyValueStore: KeyValueStore;

  constructor(deps: AuthServiceDependencies = {}) {
    this.userStore = deps.userStore ?? defaultUserStore;
    this.sessionStore = deps.sessionStore ?? defaultSessionStore;
    this.keyValueStore = deps.keyValueStore ?? defaultKeyValueStore;
  }

  async register(input: { email: string; password: string }): Promise<RegisterResult> {
    const existing = await this.userStore.findByEmail(input.email.toLowerCase());

    if (existing) {
      throw new AppError('User already exists', 409);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.userStore.create({
      email: input.email.toLowerCase(),
      passwordHash,
      role: 'student',
    });

    const verificationToken = randomToken();
    const verificationTokenHash = hashToken(verificationToken);

    await this.keyValueStore.set(
      `auth:verify:${verificationTokenHash}`,
      user.id,
      env.emailVerificationTtlSeconds,
    );

    logger.info('Email verification issued', {
      email: user.email,
      token: verificationToken,
    });

    return {
      user: toPublicUser(user),
      verificationToken: env.nodeEnv === 'production' ? undefined : verificationToken,
    };
  }

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = hashToken(token);
    const userId = await this.keyValueStore.get(`auth:verify:${tokenHash}`);

    if (!userId) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    await this.keyValueStore.set(`auth:verified:${userId}`, '1');
    await this.keyValueStore.del(`auth:verify:${tokenHash}`);
  }

  async login(input: { email: string; password: string }): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const user = await this.userStore.findByEmail(input.email.toLowerCase());

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const isVerified = await this.keyValueStore.get(`auth:verified:${user.id}`);

    if (!isVerified) {
      throw new AppError('Email not verified', 403);
    }

    const tokens = await this.createSessionTokens(user);

    return {
      user: toPublicUser(user),
      tokens,
    };
  }

  async googleOAuthLogin(input: { email: string }): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const normalizedEmail = input.email.toLowerCase();
    let user = await this.userStore.findByEmail(normalizedEmail);

    if (!user) {
      user = await this.userStore.create({
        email: normalizedEmail,
        passwordHash: await bcrypt.hash(randomUUID(), 12),
        role: 'student',
      });
    }

    await this.keyValueStore.set(`auth:verified:${user.id}`, '1');

    const tokens = await this.createSessionTokens(user);

    return {
      user: toPublicUser(user),
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const payload = this.verifyRefreshToken(refreshToken);
    const sessionId = payload.sessionId;
    const userId = payload.sub;

    const sessionData = await this.keyValueStore.get(`auth:session:${sessionId}`);
    const refreshTokenHash = hashToken(refreshToken);

    if (!sessionData) {
      throw new AppError('Session not found or expired', 401);
    }

    const parsedSession = JSON.parse(sessionData) as {
      userId: string;
      refreshTokenHash: string;
      expiresAt: number;
    };

    if (parsedSession.userId !== userId || parsedSession.refreshTokenHash !== refreshTokenHash) {
      throw new AppError('Invalid refresh token', 401);
    }

    const user = await this.userStore.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const newRefreshToken = this.signRefreshToken(user.id, sessionId);
    const newRefreshTokenHash = hashToken(newRefreshToken);
    const ttl = env.refreshTokenTtlSeconds;

    await this.sessionStore.updateRefreshTokenHash(sessionId, newRefreshTokenHash);

    await this.keyValueStore.set(
      `auth:session:${sessionId}`,
      JSON.stringify({
        userId: user.id,
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: Date.now() + ttl * 1000,
      }),
      ttl,
    );

    return {
      accessToken: this.signAccessToken(user),
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const payload = this.verifyRefreshToken(refreshToken);
    const sessionId = payload.sessionId;

    await this.keyValueStore.del(`auth:session:${sessionId}`);
    await this.sessionStore.deleteById(sessionId);
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.userStore.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return toPublicUser(user);
  }

  async forgotPassword(email: string): Promise<PasswordResetResult> {
    const user = await this.userStore.findByEmail(email.toLowerCase());

    if (!user) {
      return { message: 'If an account exists, a password reset email has been sent.' };
    }

    const resetToken = randomToken();
    const resetTokenHash = hashToken(resetToken);

    await this.keyValueStore.set(
      `auth:reset:${resetTokenHash}`,
      user.id,
      env.passwordResetTtlSeconds,
    );

    logger.info('Password reset token issued', {
      email: user.email,
      token: resetToken,
    });

    return {
      message: 'If an account exists, a password reset email has been sent.',
      resetToken: env.nodeEnv === 'production' ? undefined : resetToken,
    };
  }

  async resetPassword(input: { token: string; password: string }): Promise<void> {
    const tokenHash = hashToken(input.token);
    const userId = await this.keyValueStore.get(`auth:reset:${tokenHash}`);

    if (!userId) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    await this.userStore.updatePassword(userId, passwordHash);
    await this.keyValueStore.del(`auth:reset:${tokenHash}`);
  }

  async issueGoogleOAuthState(): Promise<string> {
    const state = randomToken();
    await this.keyValueStore.set(`auth:google:state:${state}`, '1', 600);
    return state;
  }

  async validateGoogleOAuthState(state: string): Promise<void> {
    const value = await this.keyValueStore.get(`auth:google:state:${state}`);

    if (!value) {
      throw new AppError('Invalid Google OAuth state', 400);
    }

    await this.keyValueStore.del(`auth:google:state:${state}`);
  }

  private signAccessToken(user: PersistedUser): string {
    return jwt.sign(
      {
        sub: user.id,
        role: user.role,
        email: user.email,
      },
      env.jwtAccessSecret,
      {
        expiresIn: env.accessTokenTtlSeconds,
      },
    );
  }

  private signRefreshToken(userId: string, sessionId: string): string {
    return jwt.sign(
      {
        sub: userId,
        sessionId,
        tokenId: randomUUID(),
      },
      env.jwtRefreshSecret,
      {
        expiresIn: env.refreshTokenTtlSeconds,
      },
    );
  }

  private verifyRefreshToken(refreshToken: string): { sub: string; sessionId: string } {
    try {
      const payload = jwt.verify(refreshToken, env.jwtRefreshSecret) as {
        sub: string;
        sessionId: string;
      };

      if (!payload.sub || !payload.sessionId) {
        throw new AppError('Invalid refresh token', 401);
      }

      return payload;
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  private async createSessionTokens(user: PersistedUser): Promise<AuthTokens> {
    const sessionId = randomUUID();
    const refreshToken = this.signRefreshToken(user.id, sessionId);
    const refreshTokenHash = hashToken(refreshToken);
    const ttl = env.refreshTokenTtlSeconds;

    await this.sessionStore.create({
      id: sessionId,
      userId: user.id,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + ttl * 1000),
    });

    await this.keyValueStore.set(
      `auth:session:${sessionId}`,
      JSON.stringify({
        userId: user.id,
        refreshTokenHash,
        expiresAt: Date.now() + ttl * 1000,
      }),
      ttl,
    );

    return {
      accessToken: this.signAccessToken(user),
      refreshToken,
    };
  }
}

export const createAuthService = (deps: AuthServiceDependencies = {}): AuthService => {
  return new AuthService(deps);
};
