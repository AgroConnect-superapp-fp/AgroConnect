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

export interface AuthRouterDependencies {
  controller: AuthController;
  loginRateLimiter: RequestHandler;
  forgotPasswordRateLimiter: RequestHandler;
}

export function createAuthRouter(dependencies: AuthRouterDependencies): Router {
  const router = Router();
  const { controller } = dependencies;

  router.post('/register', validateBody(registerSchema), asyncHandler(controller.register));
  router.post(
    '/login',
    dependencies.loginRateLimiter,
    validateBody(loginSchema),
    asyncHandler(controller.login),
  );
  router.post('/refresh', validateBody(refreshSchema), asyncHandler(controller.refresh));
  router.post('/logout', validateBody(logoutSchema), asyncHandler(controller.logout));
  router.post(
    '/forgot-password',
    dependencies.forgotPasswordRateLimiter,
    validateBody(forgotPasswordSchema),
    asyncHandler(controller.forgotPassword),
  );
  router.post(
    '/reset-password',
    dependencies.forgotPasswordRateLimiter,
    validateBody(resetPasswordSchema),
    asyncHandler(controller.resetPassword),
  );
  router.post(
    '/verify-email',
    dependencies.forgotPasswordRateLimiter,
    validateBody(verifyEmailSchema),
    asyncHandler(controller.verifyEmail),
  );
  router.post(
    '/resend-verification',
    dependencies.forgotPasswordRateLimiter,
    validateBody(resendVerificationSchema),
    asyncHandler(controller.resendVerification),
  );

  return router;
}
