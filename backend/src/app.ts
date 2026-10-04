import { randomUUID } from 'node:crypto';
import express from 'express';
import type { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import type { PrismaClient } from '@prisma/client';
import { env } from './config/env';
import { logger } from './shared/infrastructure/logger';
import { prisma } from './shared/infrastructure/prisma';
import { correlationId } from './shared/presentation/middleware/correlationId';
import { errorHandler } from './shared/presentation/middleware/errorHandler';
import { PrismaUserRepository } from './modules/auth/infrastructure/repositories/PrismaUserRepository';
import { BcryptPasswordHasher } from './modules/auth/infrastructure/services/BcryptPasswordHasher';
import { JwtTokenService } from './modules/auth/infrastructure/services/JwtTokenService';
import { RegisterUserUseCase } from './modules/auth/application/useCases/RegisterUserUseCase';
import { LoginUseCase } from './modules/auth/application/useCases/LoginUseCase';
import { RefreshTokenUseCase } from './modules/auth/application/useCases/RefreshTokenUseCase';
import { LogoutUseCase } from './modules/auth/application/useCases/LogoutUseCase';
import { RequestPasswordResetUseCase } from './modules/auth/application/useCases/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from './modules/auth/application/useCases/ResetPasswordUseCase';
import { RequestEmailVerificationUseCase } from './modules/auth/application/useCases/RequestEmailVerificationUseCase';
import { VerifyEmailUseCase } from './modules/auth/application/useCases/VerifyEmailUseCase';
import { PrismaPasswordResetTokenRepository } from './modules/auth/infrastructure/repositories/PrismaPasswordResetTokenRepository';
import { PrismaEmailVerificationTokenRepository } from './modules/auth/infrastructure/repositories/PrismaEmailVerificationTokenRepository';
import { FileEmailService } from './modules/auth/infrastructure/services/FileEmailService';
import type { EmailService } from './modules/auth/domain/interfaces/EmailService';
import { AuthController } from './modules/auth/presentation/controllers/AuthController';
import { createAuthRouter } from './modules/auth/presentation/routes/authRoutes';
import { createRateLimiter } from './modules/auth/presentation/middleware/rateLimiters';
import plotRoutes from './modules/geography/presentation/routes/plotRoutes';

export interface AppOptions {
  prismaClient?: PrismaClient;
  emailService?: EmailService;
}

export function createApp(options: AppOptions = {}): Express {
  const prismaClient = options.prismaClient ?? prisma;

  const userRepository = new PrismaUserRepository(prismaClient);
  const passwordHasher = new BcryptPasswordHasher(env.BCRYPT_SALT_ROUNDS);
  const tokenService = new JwtTokenService(
    env.JWT_ACCESS_SECRET,
    env.JWT_REFRESH_SECRET,
    env.JWT_ACCESS_EXPIRES_IN,
    env.JWT_REFRESH_EXPIRES_IN,
  );

  const registerUserUseCase = new RegisterUserUseCase(userRepository, passwordHasher, tokenService);
  const loginUseCase = new LoginUseCase(userRepository, passwordHasher, tokenService);
  const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, tokenService);
  const logoutUseCase = new LogoutUseCase(userRepository, tokenService);

  const passwordResetTokenRepository = new PrismaPasswordResetTokenRepository(prismaClient);
  const emailService = options.emailService ?? new FileEmailService(env.MAIL_DIR);

  const requestPasswordResetUseCase = new RequestPasswordResetUseCase(
    userRepository,
    passwordResetTokenRepository,
    emailService,
    tokenService,
    env.APP_BASE_URL,
  );
  const resetPasswordUseCase = new ResetPasswordUseCase(
    userRepository,
    passwordResetTokenRepository,
    passwordHasher,
    tokenService,
  );

  const emailVerificationTokenRepository = new PrismaEmailVerificationTokenRepository(prismaClient);
  const requestEmailVerificationUseCase = new RequestEmailVerificationUseCase(
    userRepository,
    emailVerificationTokenRepository,
    emailService,
    tokenService,
    env.APP_BASE_URL,
  );
  const verifyEmailUseCase = new VerifyEmailUseCase(
    userRepository,
    emailVerificationTokenRepository,
    tokenService,
  );

  const authController = new AuthController(
    registerUserUseCase,
    loginUseCase,
    refreshTokenUseCase,
    logoutUseCase,
    requestPasswordResetUseCase,
    resetPasswordUseCase,
    requestEmailVerificationUseCase,
    verifyEmailUseCase,
  );

  const loginRateLimiter = createRateLimiter({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_ATTEMPTS,
  });
  const forgotPasswordRateLimiter = createRateLimiter({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_ATTEMPTS,
  });

  const app = express();

  app.disable('x-powered-by');
  app.use(correlationId);
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.correlationId ?? randomUUID(),
      autoLogging: {
        ignore: (req) => req.url === '/health',
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', service: 'agroconnect-api' });
  });

  app.use(
    '/api/v1/auth',
    createAuthRouter({
      controller: authController,
      loginRateLimiter,
      forgotPasswordRateLimiter,
    }),
  );
  app.use('/api/v1', plotRoutes);

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Recurso no encontrado',
      },
      correlationId: req.correlationId,
    });
  });

  app.use(errorHandler);

  return app;
}
