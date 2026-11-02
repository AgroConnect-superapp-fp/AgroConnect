import { Router } from 'express';
import type { RequestHandler } from 'express';
import { validateBody } from '../../../../shared/presentation/middleware/validate';
import { asyncHandler } from '../../../../shared/presentation/middleware/asyncHandler';
import type { AuthController } from '../controllers/AuthController';
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../schemas/authSchemas';

export type AuthRateLimitScope =
  | 'register'
  | 'login'
  | 'refresh'
  | 'forgotPassword'
  | 'resetPassword'
  | 'verifyEmail'
  | 'resendVerification';

export interface AuthRouterDependencies {
  controller: AuthController;
  /** Un limitador independiente por ruta: los contadores no se comparten entre endpoints. */
  rateLimiters: Record<AuthRateLimitScope, RequestHandler>;
}

export function createAuthRouter(dependencies: AuthRouterDependencies): Router {
  const router = Router();
  const { controller, rateLimiters } = dependencies;

  router.post(
    '/register',
    rateLimiters.register,
    validateBody(registerSchema),
    asyncHandler(controller.register),
  );
  router.post(
    '/login',
    rateLimiters.login,
    validateBody(loginSchema),
    asyncHandler(controller.login),
  );
  router.post(
    '/refresh',
    rateLimiters.refresh,
    validateBody(refreshSchema),
    asyncHandler(controller.refresh),
  );
  router.post('/logout', validateBody(logoutSchema), asyncHandler(controller.logout));
  router.post(
    '/forgot-password',
    rateLimiters.forgotPassword,
    validateBody(forgotPasswordSchema),
    asyncHandler(controller.forgotPassword),
  );
  router.post(
    '/reset-password',
    rateLimiters.resetPassword,
    validateBody(resetPasswordSchema),
    asyncHandler(controller.resetPassword),
  );
  router.post(
    '/verify-email',
    rateLimiters.verifyEmail,
    validateBody(verifyEmailSchema),
    asyncHandler(controller.verifyEmail),
  );
  router.post(
    '/resend-verification',
    rateLimiters.resendVerification,
    validateBody(resendVerificationSchema),
    asyncHandler(controller.resendVerification),
  );

  return router;
}
