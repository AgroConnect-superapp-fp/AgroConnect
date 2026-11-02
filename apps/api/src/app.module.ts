import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { IdentityModule } from './modules/identity/presentation/identity.module';
import { GeographyModule } from './modules/geography/presentation/geography.module';
import { parseEnv } from './shared/config/env';
import { CsrfGuard } from './shared/http/csrf.guard';
import { AllExceptionsFilter } from './shared/errors/all-exceptions.filter';
import { PinoNestLogger } from './shared/logger/nest-logger.service';

/**
 * Composición raíz de la API (ADR-009).
 *
 * - `ConfigModule` es global y valida el entorno con Zod (mismos nombres de
 *   variable que el backend legacy).
 * - `ThrottlerModule` queda configurado con los valores del legacy, pero el
 *   guard NO se aplica globalmente: se aplica por ruta en el módulo identity
 *   para no limitar las sondas de `/health` que ejecuta Render.
 * - `AllExceptionsFilter` se registra como `APP_FILTER`: sin él los
 *   `DomainError` (401/403/409/422/429) saldrían como 500 en lugar del cuerpo
 *   de error que espera el cliente.
 * - `CsrfGuard` se registra como `APP_GUARD`: la sesión cross-site usa
 *   `SameSite=None`, así que `Origin` + `X-Requested-With` son obligatorios en
 *   toda petición mutante.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env'],
      validate: (raw: Record<string, unknown>) => parseEnv(raw),
    }),
    JwtModule.register({}),
    PrismaModule,
    HealthModule,
    IdentityModule,
    GeographyModule,
  ],
  providers: [
    PinoNestLogger,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: CsrfGuard },
  ],
  exports: [PinoNestLogger],
})
export class AppModule {}
