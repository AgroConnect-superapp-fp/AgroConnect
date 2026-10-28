import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { parseEnv } from './shared/config/env';
import { PinoNestLogger } from './shared/logger/nest-logger.service';

/**
 * Composición raíz de la API (ADR-009).
 *
 * - `ConfigModule` es global y valida el entorno con Zod (mismos nombres de
 *   variable que el backend legacy).
 * - `ThrottlerModule` queda configurado con los valores del legacy, pero el
 *   guard NO se aplica globalmente: se aplica por ruta en el módulo identity
 *   para no limitar las sondas de `/health` que ejecuta Render.
 * - `JwtModule` queda registrado para el módulo identity (próximo paso).
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env'],
      validate: (raw: Record<string, unknown>) => parseEnv(raw),
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: parseEnv(process.env).RATE_LIMIT_WINDOW_MS,
          limit: parseEnv(process.env).RATE_LIMIT_MAX_ATTEMPTS,
        },
      ],
    }),
    JwtModule.register({}),
    PrismaModule,
    HealthModule,
  ],
  providers: [PinoNestLogger],
  exports: [PinoNestLogger],
})
export class AppModule {}
