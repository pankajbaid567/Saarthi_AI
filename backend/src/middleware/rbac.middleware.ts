import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/app-error.js';
import type { UserRole } from '../services/auth.service.js';

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.authUser?.role;

    if (!role) {
      next(new AppError('Authentication required', 401));
      return;
    }

    if (!allowedRoles.includes(role)) {
      next(new AppError('Forbidden', 403));
      return;
    }

    next();
  };
};
