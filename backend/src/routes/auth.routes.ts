import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import { validateRequest } from '../middleware/request-validation.js';
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../schemas/auth.schema.js';
import { createAuthService, type AuthService } from '../services/auth.service.js';

const googleAuthBaseUrl = 'https://accounts.google.com/o/oauth2/v2/auth';

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void handler(req, res, next).catch(next);
  };

type CreateAuthRouterOptions = {
  authService?: AuthService;
};

export const createAuthRouter = (options: CreateAuthRouterOptions = {}): Router => {
  const router = Router();
  const authService = options.authService ?? createAuthService();

  router.post(
    '/register',
    authRateLimiter,
    validateRequest(registerSchema),
    asyncHandler(async (req, res) => {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    }),
  );

  router.post(
    '/verify-email',
    authRateLimiter,
    validateRequest(verifyEmailSchema),
    asyncHandler(async (req, res) => {
      await authService.verifyEmail(req.body.token);
      res.status(200).json({ message: 'Email verified successfully' });
    }),
  );

  router.post(
    '/login',
    authRateLimiter,
    validateRequest(loginSchema),
    asyncHandler(async (req, res) => {
      const result = await authService.login(req.body);
      res.status(200).json(result);
    }),
  );

  router.post(
    '/refresh',
    authRateLimiter,
    validateRequest(refreshSchema),
    asyncHandler(async (req, res) => {
      const tokens = await authService.refresh(req.body.refreshToken);
      res.status(200).json(tokens);
    }),
  );

  router.post(
    '/logout',
    authRateLimiter,
    validateRequest(logoutSchema),
    asyncHandler(async (req, res) => {
      await authService.logout(req.body.refreshToken);
      res.status(200).json({ message: 'Logged out successfully' });
    }),
  );

  router.get(
    '/me',
    authRateLimiter,
    authMiddleware,
    asyncHandler(async (req, res) => {
      if (!req.authUser) {
        throw new AppError('Authentication required', 401);
      }

      const user = await authService.me(req.authUser.userId);
      res.status(200).json(user);
    }),
  );

  router.post(
    '/forgot-password',
    authRateLimiter,
    validateRequest(forgotPasswordSchema),
    asyncHandler(async (req, res) => {
      const result = await authService.forgotPassword(req.body.email);
      res.status(200).json(result);
    }),
  );

  router.post(
    '/reset-password',
    authRateLimiter,
    validateRequest(resetPasswordSchema),
    asyncHandler(async (req, res) => {
      await authService.resetPassword(req.body);
      res.status(200).json({ message: 'Password reset successfully' });
    }),
  );

  router.get(
    '/google',
    authRateLimiter,
    asyncHandler(async (_req, res) => {
      if (!env.googleClientId || !env.googleCallbackUrl) {
        throw new AppError('Google OAuth is not configured', 500);
      }

      const state = await authService.issueGoogleOAuthState();
      const redirectUrl = new URL(googleAuthBaseUrl);
      redirectUrl.searchParams.set('client_id', env.googleClientId);
      redirectUrl.searchParams.set('redirect_uri', env.googleCallbackUrl);
      redirectUrl.searchParams.set('response_type', 'code');
      redirectUrl.searchParams.set('scope', 'openid email profile');
      redirectUrl.searchParams.set('state', state);
      redirectUrl.searchParams.set('access_type', 'offline');

      res.redirect(302, redirectUrl.toString());
    }),
  );

  router.get(
    '/google/callback',
    authRateLimiter,
    asyncHandler(async (req, res) => {
      const { code, state } = req.query;

      if (typeof code !== 'string' || typeof state !== 'string') {
        throw new AppError('Google OAuth callback requires code and state', 400);
      }

      await authService.validateGoogleOAuthState(state);

      if (!env.googleClientId || !env.googleClientSecret || !env.googleCallbackUrl) {
        throw new AppError('Google OAuth is not configured', 500);
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: env.googleClientId,
          client_secret: env.googleClientSecret,
          redirect_uri: env.googleCallbackUrl,
          grant_type: 'authorization_code',
        }),
      });

      if (!tokenResponse.ok) {
        throw new AppError('Google OAuth token exchange failed', 401);
      }

      const tokenPayload = (await tokenResponse.json()) as {
        access_token?: string;
      };

      if (!tokenPayload.access_token) {
        throw new AppError('Google OAuth token exchange failed', 401);
      }

      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${tokenPayload.access_token}`,
        },
      });

      if (!profileResponse.ok) {
        throw new AppError('Unable to fetch Google profile', 401);
      }

      const profilePayload = (await profileResponse.json()) as {
        email?: string;
      };

      if (!profilePayload.email) {
        throw new AppError('Google account does not provide email', 400);
      }

      const result = await authService.googleOAuthLogin({ email: profilePayload.email });
      res.status(200).json(result);
    }),
  );

  return router;
};
