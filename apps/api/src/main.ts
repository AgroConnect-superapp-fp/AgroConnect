import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { env } from './shared/config/env';
import { logger } from './shared/logger/logger';
import { PinoNestLogger } from './shared/logger/nest-logger.service';

/**
 * Punto de entrada de @agroconnect/api.
 *
 * `dotenv/config` va PRIMERO: el entorno debe estar cargado antes de que se
 * valide (`shared/config/env.ts` se evalúa al importarse).
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(PinoNestLogger));

  // `/health` vive en la raíz (como en el backend legacy); el resto de la API
  // queda bajo `/api/v1`.
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  configureApp(app);

  await app.listen(env.PORT);

  logger.info(
    { port: env.PORT, environment: env.NODE_ENV },
    'AgroConnect API (NestJS) escuchando',
  );
}

bootstrap().catch((error: unknown) => {
  logger.fatal({ err: error }, 'No fue posible iniciar la API');
  process.exit(1);
});
