import type { AuthSession, LoginPayload, RegisterPayload } from '../types';
import { API_URL, ApiError, apiRequest } from '../../services/apiClient';

export { API_URL, ApiError };

/**
 * Cliente del módulo de identidad.
 *
 * La sesión es cookie-only: el navegador adjunta access/refresh en cookies
 * httpOnly y el JavaScript nunca lee ni envía tokens.
 */
export const authApi = {
  register(payload: RegisterPayload): Promise<AuthSession> {
    return apiRequest<AuthSession>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login(payload: LoginPayload): Promise<AuthSession> {
    return apiRequest<AuthSession>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Cookie-only: el refreshToken vive en la cookie httpOnly y el navegador lo
  // adjunta solo. La respuesta trae la sesión completa (usuario + tokens) para
  // restaurar el estado tras recargar la página.
  refresh(): Promise<AuthSession> {
    return apiRequest<AuthSession>('/api/v1/auth/refresh', {
      method: 'POST',
    });
  },

  logout(): Promise<void> {
    return apiRequest<void>('/api/v1/auth/logout', {
      method: 'POST',
    });
  },

  forgotPassword(correo: string): Promise<null> {
    return apiRequest<null>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ correo }),
    });
  },

  resetPassword(token: string, password: string): Promise<null> {
    return apiRequest<null>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  verifyEmail(token: string): Promise<null> {
    return apiRequest<null>('/api/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  resendVerification(correo: string): Promise<null> {
    return apiRequest<null>('/api/v1/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ correo }),
    });
  },
};
