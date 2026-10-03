import type { AuthSession, LoginPayload, RegisterPayload, SessionTokens } from '../types';

const API_URL: string = import.meta.env['VITE_API_URL'] ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: string[]
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiSuccessBody<T> {
  success: true;
  data: T;
  message: string;
}

interface ApiFailureBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
  correlationId?: string;
}

type ApiBody<T> = ApiSuccessBody<T> | ApiFailureBody;

function isFailure<T>(body: ApiBody<T>): body is ApiFailureBody {
  return body.success === false;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      'No fue posible conectar con el servidor. Verifica tu conexión e intenta de nuevo.'
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json().catch(() => null)) as ApiBody<T> | null;

  if (!response.ok) {
    if (body && isFailure(body)) {
      throw new ApiError(
        response.status,
        body.error.code,
        body.error.message,
        body.error.details
      );
    }

    throw new ApiError(
      response.status,
      'INTERNAL_ERROR',
      'Ocurrió un error inesperado. Intenta de nuevo más tarde.'
    );
  }

  if (!body || !('data' in body)) {
    throw new ApiError(
      response.status,
      'INTERNAL_ERROR',
      'Respuesta inesperada del servidor.'
    );
  }

  return body.data;
}

export const authApi = {
  register(payload: RegisterPayload): Promise<AuthSession> {
    return request<AuthSession>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login(payload: LoginPayload): Promise<AuthSession> {
    return request<AuthSession>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  refresh(refreshToken: string): Promise<{ tokens: SessionTokens }> {
    return request<{ tokens: SessionTokens }>('/api/v1/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  logout(refreshToken: string): Promise<void> {
    return request<void>('/api/v1/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  forgotPassword(correo: string): Promise<null> {
    return request<null>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ correo }),
    });
  },

  resetPassword(token: string, password: string): Promise<null> {
    return request<null>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },

  verifyEmail(token: string): Promise<null> {
    return request<null>('/api/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  resendVerification(correo: string): Promise<null> {
    return request<null>('/api/v1/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ correo }),
    });
  },
};

export { API_URL };
