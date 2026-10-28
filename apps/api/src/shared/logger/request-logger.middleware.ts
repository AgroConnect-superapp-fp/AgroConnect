import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import pinoHttp from 'pino-http';
import { logger } from './logger';

/**
 * Log HTTP por petición con Pino (`pino-http`), reutilizando el correlation ID
 * generado por `correlationId`. Mismo comportamiento que el legacy: no se
 * loggean las peticiones a `/health` y el nivel depende del status.
 */
export const requestLogger = pinoHttp({
  logger,
  genReqId: (req) => {
    const correlationId = (req as IncomingMessage & { correlationId?: string }).correlationId;
    return correlationId ?? randomUUID();
  },
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
