import { createLogger, format, transports } from 'winston';
import * as Sentry from '@sentry/node';
import TransportStream from 'winston-transport';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class SentryTransport extends TransportStream {
  constructor(opts?: TransportStream.TransportStreamOptions) {
    super(opts);
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    if (info.level === 'error') {
      const error = info.error || new Error(info.message);
      Sentry.withScope((scope) => {
        if (info.statusCode) scope.setExtra('statusCode', info.statusCode);
        if (info.userId) scope.setUser({ id: info.userId });
        Sentry.captureException(error);
      });
    } else if (info.level === 'warn') {
      Sentry.captureMessage(info.message, 'warning');
    }

    callback();
  }
}

const customTransports: transports.StreamTransportInstance[] = [
  new transports.Console(),
];

if (process.env.NODE_ENV === 'production' || process.env.SENTRY_DSN) {
  customTransports.push(new SentryTransport());
}

export const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  transports: customTransports,
});
