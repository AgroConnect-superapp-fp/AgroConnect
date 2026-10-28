/**
 * Esquemas de autenticación — reexportados desde el contrato compartido.
 *
 * Fuente única: @agroconnect/contracts (ADR-015, contract-first). Este archivo
 * se conserva como fachada de presentación para no cambiar los imports de las
 * rutas; la validación en servidor usa exactamente los mismos esquemas que el
 * frontend y el resto de consumidores del contrato.
 */
export {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  type ForgotPasswordRequestBody,
  type LoginRequestBody,
  type LogoutRequestBody,
  type RefreshRequestBody,
  type RegisterRequestBody,
  type ResendVerificationRequestBody,
  type ResetPasswordRequestBody,
  type VerifyEmailRequestBody,
} from '@agroconnect/contracts';
