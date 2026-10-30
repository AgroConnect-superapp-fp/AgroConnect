import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '@agroconnect/contracts';
import { RegisterUserUseCase } from '../../application/use-cases/RegisterUserUseCase';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshTokenUseCase';
import { LogoutUseCase } from '../../application/use-cases/LogoutUseCase';
import { RequestPasswordResetUseCase } from '../../application/use-cases/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from '../../application/use-cases/ResetPasswordUseCase';
import { RequestEmailVerificationUseCase } from '../../application/use-cases/RequestEmailVerificationUseCase';
import { VerifyEmailUseCase } from '../../application/use-cases/VerifyEmailUseCase';
import type {
  ForgotPasswordInput,
  LoginInput,
  LogoutInput,
  RefreshInput,
  RegisterUserInput,
  ResendVerificationInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from '../../application/dtos/authDtos';
import { ZodValidationPipe } from '../../../../shared/http/zod-validation.pipe';
import { success } from '../../../../shared/http/responses';
import { logger } from '../../../../shared/logger/logger';
import { env } from '../../../../shared/config/env';
import { AuthThrottlerGuard } from '../guards/AuthThrottlerGuard';
import { SessionCookieService } from '../http/SessionCookieService';
import { SessionTokenInterceptor } from '../http/SessionTokenInterceptor';

const RATE_LIMIT = {
  limit: env.RATE_LIMIT_MAX_ATTEMPTS,
  ttl: env.RATE_LIMIT_WINDOW_MS,
};

/**
 * Controlador de autenticación.
 *
 * Réplica exacta del backend legacy (`backend/src/modules/auth/presentation`):
 * mismas rutas bajo `/api/v1/auth`, mismos códigos de estado y mismo cuerpo
 * `{ success, data, message }`.
 *
 * Diferencia intencionada: la sesión se entrega además en cookies `httpOnly`
 * (la vía segura). El cuerpo de la respuesta se conserva para no romper al
 * frontend legacy durante la migración progresiva.
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly resetPasswordUseCase: ResetPasswordUseCase,
    private readonly requestEmailVerificationUseCase: RequestEmailVerificationUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly sessionCookies: SessionCookieService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: RATE_LIMIT })
  async register(
    @Body(new ZodValidationPipe(registerSchema)) body: RegisterUserInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<unknown> {
    const result = await this.registerUserUseCase.execute(body);

    // El correo de verificación es best-effort: se dispara sin bloquear la
    // respuesta. Un SMTP lento o caído no puede penalizar el P95 del registro
    // (medido: un intento SMTP fallido añadía ~10 s al endpoint).
    void this.requestEmailVerificationUseCase
      .execute({ correo: result.user.correo })
      .catch((error: unknown) => {
        logger.warn({ err: error }, 'No fue posible enviar el correo de verificación');
      });

    this.sessionCookies.setSessionCookies(response, result.tokens);

    return success(
      {
        usuario: result.user,
        tokens: result.tokens,
      },
      'Registro exitoso',
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: RATE_LIMIT })
  async login(
    @Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<unknown> {
    const result = await this.loginUseCase.execute(body);

    this.sessionCookies.setSessionCookies(response, result.tokens);

    return success(
      {
        usuario: result.user,
        tokens: result.tokens,
      },
      'Inicio de sesión exitoso',
    );
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthThrottlerGuard)
  @UseInterceptors(SessionTokenInterceptor)
  // El refresh es legítimamente frecuente (cada 15 min por pestaña): margen mayor.
  @Throttle({ default: { limit: RATE_LIMIT.limit * 10, ttl: RATE_LIMIT.ttl } })
  async refresh(
    @Body(new ZodValidationPipe(refreshSchema)) body: RefreshInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<unknown> {
    const result = await this.refreshTokenUseCase.execute(body);

    this.sessionCookies.setSessionCookies(response, result.tokens);

    // Mismo shape que login/register: el frontend restaura la sesión completa
    // con el usuario renovado. El refreshToken del cuerpo se ignora en el
    // frontend nuevo (la cookie httpOnly es la única vía legítima).
    return success(
      {
        usuario: result.user,
        tokens: result.tokens,
      },
      'Token renovado',
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(SessionTokenInterceptor)
  async logout(
    @Body(new ZodValidationPipe(logoutSchema)) body: LogoutInput,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.logoutUseCase.execute(body);

    this.sessionCookies.clearSessionCookies(response);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: RATE_LIMIT })
  async forgotPassword(
    @Body(new ZodValidationPipe(forgotPasswordSchema)) body: ForgotPasswordInput,
  ): Promise<unknown> {
    await this.requestPasswordResetUseCase.execute(body);

    return success(
      null,
      'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña',
    );
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: RATE_LIMIT })
  async resetPassword(
    @Body(new ZodValidationPipe(resetPasswordSchema)) body: ResetPasswordInput,
  ): Promise<unknown> {
    await this.resetPasswordUseCase.execute(body);

    return success(null, 'Contraseña actualizada correctamente');
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: RATE_LIMIT })
  async verifyEmail(
    @Body(new ZodValidationPipe(verifyEmailSchema)) body: VerifyEmailInput,
  ): Promise<unknown> {
    await this.verifyEmailUseCase.execute(body);

    return success(null, 'Correo verificado correctamente');
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: RATE_LIMIT })
  async resendVerification(
    @Body(new ZodValidationPipe(resendVerificationSchema)) body: ResendVerificationInput,
  ): Promise<unknown> {
    await this.requestEmailVerificationUseCase.execute(body);

    return success(
      null,
      'Si el correo está registrado y sin verificar, recibirás un nuevo enlace de verificación',
    );
  }
}
