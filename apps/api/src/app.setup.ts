import { HttpStatus } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { env } from './shared/config/env';
import { correlationId } from './shared/http/correlation-id.middleware';
import { requestLogger } from './shared/logger/request-logger.middleware';

/**
 * Límite del cuerpo JSON.
 *
 * El valor por defecto de body-parser (100 kB) es demasiado alto para una API
 * rural con conexiones lentas: un cuerpo enorme consume CPU y memoria antes
 * de ser rechazado. 32 kB cubre de sobra el registro, el login y la creación
 * de parcelas.
 */
const JSON_BODY_LIMIT = '32kb';

/**
 * Detecta el error de body-parser cuando el cuerpo supera el límite.
 * Se distingue por su `type` (`entity.too.large`) y su `status` (413).
 */
function isPayloadTooLarge(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  const candidate = error as { type?: unknown; status?: unknown };
  return (
    candidate.type === 'entity.too.large' ||
    candidate.status === HttpStatus.PAYLOAD_TOO_LARGE
  );
}

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

  // CORS se registra ANTES del parser JSON a propósito. Cuando el parser
  // rechaza el cuerpo con 413, Express salta los middlewares normales (CORS
  // incluido) y el navegador vería un fallo de CORS en lugar del 413. Con CORS
  // antes, las cabeceras `Access-Control-Allow-Origin` ya están escritas en la
  // respuesta cuando se emite el error.
  //
  // Verificado en @nestjs/platform-express 11.2.8: `enableCors` y
  // `useBodyParser` registran su middleware de inmediato en el stack de Express
  // (`this.use(cors(options))` y `this.use(express[type](options))`), por lo que
  // el orden de estas dos llamadas ES el orden de ejecución.
  app.enableCors({
    // Lista ya validada por `parseEnv`: sin comodines, URLs absolutas y
    // `https://` en producción. Nunca se reparte la cadena cruda.
    origin: [...env.CORS_ORIGINS],
    credentials: true,
    // `X-Requested-With` es el header que exige CsrfGuard; sin declararlo, el
    // preflight del navegador lo bloquearía.
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['x-correlation-id'],
    maxAge: 86_400,
  });

  // Límite explícito del cuerpo JSON. `useBodyParser` reemplaza el parser por
  // defecto de NestJS (100 kB) porque se registra antes de `app.init()`.
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });

  // Traduce el error de body-parser a una respuesta 413 con el formato de
  // error de la API. Sin esto, el error entraría como fallo no controlado y
  // el cliente recibiría un 500 en lugar de un 413 explicativo.
  app.use((error: unknown, request: Request, response: Response, next: NextFunction) => {
    if (!isPayloadTooLarge(error)) {
      next(error);
      return;
    }

    response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: `El cuerpo de la petición supera el límite de ${JSON_BODY_LIMIT}.`,
      },
      correlationId: request.correlationId,
    });
  });

  // Evita que PII de sesión/perfil y datos de finca (GPS, geometría) queden en
  // cachés de navegador o proxies.
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (
      request.path.startsWith('/api/v1/auth') ||
      request.path.startsWith('/api/v1/profile') ||
      request.path.startsWith('/api/v1/plots')
    ) {
      response.setHeader('Cache-Control', 'no-store');
    }
    next();
  });

}
