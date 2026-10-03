import type { NextFunction, Request, Response } from 'express';
import { success } from '../../../../shared/presentation/http/responses';
import { logger } from '../../../../shared/infrastructure/logger';
import type { RegisterUserUseCase } from '../../application/useCases/RegisterUserUseCase';
import type { LoginUseCase } from '../../application/useCases/LoginUseCase';
import type { RefreshTokenUseCase } from '../../application/useCases/RefreshTokenUseCase';
import type { LogoutUseCase } from '../../application/useCases/LogoutUseCase';
import type { RequestPasswordResetUseCase } from '../../application/useCases/RequestPasswordResetUseCase';
import type { ResetPasswordUseCase } from '../../application/useCases/ResetPasswordUseCase';
import type { RequestEmailVerificationUseCase } from '../../application/useCases/RequestEmailVerificationUseCase';
import type { VerifyEmailUseCase } from '../../application/useCases/VerifyEmailUseCase';
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
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as RegisterUserInput;
      const result = await this.registerUserUseCase.execute(input);

      try {
        await this.requestEmailVerificationUseCase.execute({ correo: result.user.correo });
      } catch (error) {
        logger.warn({ err: error }, 'No fue posible enviar el correo de verificación');
      }

      res.status(201).json(
        success(
          {
            usuario: result.user,
            tokens: result.tokens,
          },
          'Registro exitoso',
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as LoginInput;
      const result = await this.loginUseCase.execute(input);

      res.status(200).json(
        success(
          {
            usuario: result.user,
            tokens: result.tokens,
          },
          'Inicio de sesión exitoso',
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as RefreshInput;
      const tokens = await this.refreshTokenUseCase.execute(input);

      res.status(200).json(success({ tokens }, 'Token renovado'));
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as LogoutInput;
      await this.logoutUseCase.execute(input);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as ForgotPasswordInput;
      await this.requestPasswordResetUseCase.execute(input);

      res.status(202).json(
        success(
          null,
          'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña',
        ),
      );
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as ResetPasswordInput;
      await this.resetPasswordUseCase.execute(input);

      res.status(200).json(success(null, 'Contraseña actualizada correctamente'));
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as VerifyEmailInput;
      await this.verifyEmailUseCase.execute(input);

      res.status(200).json(success(null, 'Correo verificado correctamente'));
    } catch (error) {
      next(error);
    }
  };

  resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = req.body as ResendVerificationInput;
      await this.requestEmailVerificationUseCase.execute(input);

      res.status(202).json(
        success(
          null,
          'Si el correo está registrado y sin verificar, recibirás un nuevo enlace de verificación',
        ),
      );
    } catch (error) {
      next(error);
    }
  };
}
