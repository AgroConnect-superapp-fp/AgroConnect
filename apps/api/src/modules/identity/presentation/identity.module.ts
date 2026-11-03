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
import { Argon2PasswordHasher } from '../infrastructure/services/Argon2PasswordHasher';
import { JwtTokenService } from '../infrastructure/services/JwtTokenService';
import { FileEmailService } from '../infrastructure/services/FileEmailService';
import { SmtpEmailService } from '../infrastructure/services/SmtpEmailService';
import { AuthController } from './controllers/AuthController';
import { AuthThrottlerGuard } from './guards/AuthThrottlerGuard';
import { SessionCookieService } from './http/SessionCookieService';
import { SessionTokenInterceptor } from './http/SessionTokenInterceptor';
import { PrismaModule } from '../../../prisma/prisma.module';
import { env } from '../../../shared/config/env';
import type { UserRepository } from '../domain/interfaces/UserRepository';
import type { PasswordHasher } from '../domain/interfaces/PasswordHasher';
import type { TokenService } from '../domain/interfaces/TokenService';
import type { EmailService } from '../domain/interfaces/EmailService';
import type { EmailVerificationTokenRepository } from '../domain/interfaces/EmailVerificationTokenRepository';
import type { PasswordResetTokenRepository } from '../domain/interfaces/PasswordResetTokenRepository';

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
      useFactory: () => new Argon2PasswordHasher(),
    },
    {
      provide: TOKEN_SERVICE,
      useFactory: () =>
        new JwtTokenService(
          env.JWT_ACCESS_SECRET,
          env.JWT_REFRESH_SECRET,
          env.JWT_ACCESS_EXPIRES_IN,
          env.JWT_REFRESH_EXPIRES_IN,
          env.JWT_ISSUER,
          env.JWT_AUDIENCE,
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

    // Casos de uso: composition root. La capa `application` no conoce NestJS;
    // los módulos instancian los casos de uso con sus puertos inyectados.
    {
      provide: RegisterUserUseCase,
      useFactory: (userRepository: UserRepository, passwordHasher: PasswordHasher) =>
        new RegisterUserUseCase(userRepository, passwordHasher),
      inject: [USER_REPOSITORY, PASSWORD_HASHER],
    },
    {
      provide: LoginUseCase,
      useFactory: (
        userRepository: UserRepository,
        passwordHasher: PasswordHasher,
        tokenService: TokenService,
      ) => new LoginUseCase(userRepository, passwordHasher, tokenService),
      inject: [USER_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (userRepository: UserRepository, tokenService: TokenService) =>
        new RefreshTokenUseCase(userRepository, tokenService),
      inject: [USER_REPOSITORY, TOKEN_SERVICE],
    },
    {
      provide: LogoutUseCase,
      useFactory: (userRepository: UserRepository, tokenService: TokenService) =>
        new LogoutUseCase(userRepository, tokenService),
      inject: [USER_REPOSITORY, TOKEN_SERVICE],
    },
    {
      provide: RequestPasswordResetUseCase,
      useFactory: (
        userRepository: UserRepository,
        passwordResetTokenRepository: PasswordResetTokenRepository,
        emailService: EmailService,
        tokenService: TokenService,
        appBaseUrl: string,
      ) =>
        new RequestPasswordResetUseCase(
          userRepository,
          passwordResetTokenRepository,
          emailService,
          tokenService,
          appBaseUrl,
        ),
      inject: [
        USER_REPOSITORY,
        PASSWORD_RESET_TOKEN_REPOSITORY,
        EMAIL_SERVICE,
        TOKEN_SERVICE,
        APP_BASE_URL,
      ],
    },
    {
      provide: ResetPasswordUseCase,
      useFactory: (
        userRepository: UserRepository,
        passwordResetTokenRepository: PasswordResetTokenRepository,
        passwordHasher: PasswordHasher,
        tokenService: TokenService,
      ) =>
        new ResetPasswordUseCase(
          userRepository,
          passwordResetTokenRepository,
          passwordHasher,
          tokenService,
        ),
      inject: [USER_REPOSITORY, PASSWORD_RESET_TOKEN_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE],
    },
    {
      provide: RequestEmailVerificationUseCase,
      useFactory: (
        userRepository: UserRepository,
        emailVerificationTokenRepository: EmailVerificationTokenRepository,
        emailService: EmailService,
        tokenService: TokenService,
        appBaseUrl: string,
      ) =>
        new RequestEmailVerificationUseCase(
          userRepository,
          emailVerificationTokenRepository,
          emailService,
          tokenService,
          appBaseUrl,
        ),
      inject: [
        USER_REPOSITORY,
        EMAIL_VERIFICATION_TOKEN_REPOSITORY,
        EMAIL_SERVICE,
        TOKEN_SERVICE,
        APP_BASE_URL,
      ],
    },
    {
      provide: VerifyEmailUseCase,
      useFactory: (
        userRepository: UserRepository,
        emailVerificationTokenRepository: EmailVerificationTokenRepository,
        tokenService: TokenService,
      ) =>
        new VerifyEmailUseCase(userRepository, emailVerificationTokenRepository, tokenService),
      inject: [USER_REPOSITORY, EMAIL_VERIFICATION_TOKEN_REPOSITORY, TOKEN_SERVICE],
    },

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
