import 'dotenv/config';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './shared/infrastructure/logger';
import { disconnectPrisma } from './shared/infrastructure/prisma';

function bootstrap(): void {
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, environment: env.NODE_ENV },
      'AgroConnect API escuchando',
    );
  });

  const shutdown = (signal: string): void => {
    logger.info({ signal }, 'Apagando servidor');
    server.close(() => {
      void disconnectPrisma().finally(() => {
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

try {
  bootstrap();
} catch (error: unknown) {
  logger.fatal({ err: error }, 'No fue posible iniciar la API');
  process.exit(1);
}
