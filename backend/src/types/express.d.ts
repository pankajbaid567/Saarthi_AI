import type { UserRole } from '../services/auth.service.js';

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        userId: string;
        role: UserRole;
        email: string;
      };
    }
  }
}

export {};
