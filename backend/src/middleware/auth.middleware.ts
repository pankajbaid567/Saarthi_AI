import type { NextFunction, Request, Response } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';

import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

type AccessTokenPayload = JwtPayload & {
  sub: string;
  role: 'student' | 'admin' | 'content_manager';
  email: string;
};

export const authMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    next(new AppError('Authentication required', 401));
    return;
  }

  const token = authorization.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;

    req.authUser = {
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
    };

    next();
  } catch {
    next(new AppError('Invalid access token', 401));
  }
};
