import pino from 'pino';
import { env } from '../../config/env';

const REDACTED_PATHS = [
  'req.headers.authorization',
  'req.headers.cookie',
  'res.headers["set-cookie"]',
  'password',
  'passwordHash',
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.refreshToken',
  'correo',
  '*.correo',
  'email',
  '*.email',
  'celular',
  '*.celular',
  'phone',
  '*.phone',
  'documento',
  '*.documento',
  'document',
  '*.document',
];

export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: REDACTED_PATHS,
    censor: '[REDACTED]',
  },
  base: {
    service: 'agroconnect-api',
    environment: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname,service,environment',
          },
        }
      : undefined,
});
