import * as Sentry from '@sentry/node';
import { env } from '../config/env.js';

export const initSentry = () => {
  // If no DSN is provided, Sentry will just gracefully do nothing.
  Sentry.init({
    dsn: env.sentryDsn || process.env.SENTRY_DSN || '',
    environment: env.nodeEnv || 'development',
    tracesSampleRate: 1.0, // Capture 100% of transactions for performance monitoring
  });
};

export { Sentry };
