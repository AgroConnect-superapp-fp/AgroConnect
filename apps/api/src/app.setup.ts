import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { env } from './shared/config/env';
import { correlationId } from './shared/http/correlation-id.middleware';
import { requestLogger } from './shared/logger/request-logger.middleware';

/**
 * Configuración HTTP común al arranque y a las pruebas e2e.
 *
 * Réplica del bootstrap del backend legacy (`backend/src/app.ts`):
 *  - `trust proxy` con los saltos de `TRUST_PROXY` (Render = 1),
 *  - correlation ID por petición,
 *  - log HTTP con Pino,
 *  - cabeceras de seguridad con Helmet,
 *  - cookies httpOnly (necesarias para la sesión del módulo identity),
 *  - CORS con lista explícita de orígenes y `credentials: true`.
 */
export function configureApp(app: NestExpressApplication): void {
  // Detrás del proxy de Render, sin esto todas las peticiones comparten la IP
  // del balanceador y el rate limit se vuelve global.
  app.set('trust proxy', env.TRUST_PROXY);

  app.use(correlationId);
  app.use(requestLogger);
  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
    credentials: true,
  });
}
