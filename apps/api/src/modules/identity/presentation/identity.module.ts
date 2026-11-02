import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  APP_BASE_URL,
  EMAIL_SERVICE,
  EMAIL_VERIFICATION_TOKEN_REPOSITORY,
  PASSWORD_HASHER,
  PASSWORD_RESET_TOKEN_REPOSITORY,
  TOKEN_SERVICE,
  USER_REPOSITORY,
} from '../application/tokens';
import { RegisterUserUseCase } from '../application/use-cases/RegisterUserUseCase';
import { LoginUseCase } from '../application/use-cases/LoginUseCase';
import { RefreshTokenUseCase } from '../application/use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from '../application/use-cases/LogoutUseCase';
import { RequestPasswordResetUseCase } from '../application/use-cases/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from '../application/use-cases/ResetPasswordUseCase';
import { RequestEmailVerificationUseCase } from '../application/use-cases/RequestEmailVerificationUseCase';
import { VerifyEmailUseCase } from '../application/use-cases/VerifyEmailUseCase';
import { PrismaUserRepository } from '../infrastructure/repositories/PrismaUserRepository';
import { PrismaEmailVerificationTokenRepository } from '../infrastructure/repositories/PrismaEmailVerificationTokenRepository';
import { PrismaPasswordResetTokenRepository } from '../infrastructure/repositories/PrismaPasswordResetTokenRepository';
import { BcryptPasswordHasher } from '../infrastructure/services/BcryptPasswordHasher';
import { JwtTokenService } from '../infrastructure/services/JwtTokenService';
import { FileEmailService } from '../infrastructure/services/FileEmailService';
import { SmtpEmailService } from '../infrastructure/services/SmtpEmailService';
import { AuthController } from './controllers/AuthController';
import { AuthThrottlerGuard } from './guards/AuthThrottlerGuard';
import { SessionCookieService } from './http/SessionCookieService';
import { SessionTokenInterceptor } from './http/SessionTokenInterceptor';
import { PrismaModule } from '../../../prisma/prisma.module';
import { env } from '../../../shared/config/env';

/**
 * Módulo de identidad (autenticación).
 *
 * Estructura hexagonal heredada del backend legacy:
 * - `domain`: entidades, value-objects, errores y puertos (sin NestJS).
 * - `application`: casos de uso con los puertos inyectados por token.
 * - `infrastructure`: repositorios Prisma y servicios (hash, tokens, correo).
 * - `presentation`: controller, guard de rate limiting y gestión de cookies.
 */
@Module({
  imports: [
    PrismaModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: env.RATE_LIMIT_WINDOW_MS,
        limit: env.RATE_LIMIT_MAX_ATTEMPTS,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [
    // Puertos del dominio → implementaciones de infraestructura.
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    {
      provide: EMAIL_VERIFICATION_TOKEN_REPOSITORY,
      useClass: PrismaEmailVerificationTokenRepository,
    },
    {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useClass: PrismaPasswordResetTokenRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useFactory: () => new BcryptPasswordHasher(env.BCRYPT_SALT_ROUNDS),
    },
    {
      provide: TOKEN_SERVICE,
      useFactory: () =>
        new JwtTokenService(
          env.JWT_ACCESS_SECRET,
          env.JWT_REFRESH_SECRET,
          env.JWT_ACCESS_EXPIRES_IN,
          env.JWT_REFRESH_EXPIRES_IN,
        ),
    },
    {
      // SMTP real cuando hay servidor configurado; si no, se escriben los
      // correos en disco (desarrollo y pruebas). La selección ocurre aquí, no
      // dentro de los casos de uso.
      provide: EMAIL_SERVICE,
      useFactory: () =>
        env.SMTP_HOST
          ? new SmtpEmailService({
              host: env.SMTP_HOST,
              port: env.SMTP_PORT,
              user: env.SMTP_USER,
              pass: env.SMTP_PASS,
              secure: env.SMTP_SECURE,
              from: env.SMTP_FROM,
            })
          : new FileEmailService(env.MAIL_DIR),
    },
    { provide: APP_BASE_URL, useValue: env.APP_BASE_URL },

    // Casos de uso.
    RegisterUserUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    RequestEmailVerificationUseCase,
    VerifyEmailUseCase,

    // Presentación.
    AuthThrottlerGuard,
    SessionCookieService,
    SessionTokenInterceptor,
  ],
  exports: [
    RegisterUserUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    RequestPasswordResetUseCase,
    ResetPasswordUseCase,
    RequestEmailVerificationUseCase,
    VerifyEmailUseCase,
  ],
})
export class IdentityModule {}
