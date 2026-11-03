/**
 * Cliente HTTP compartido del frontend.
 *
 * Centraliza la URL de la API, el sobre `{ success, data, error }`, las
 * credenciales cookie-only y el header CSRF. Los servicios de dominio
 * (`authClient`, `productsApi`) solo describen rutas y payloads.
 */
export const API_URL: string = import.meta.env['VITE_API_URL'] ?? 'http://localhost:4000';

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

/**
 * Ejecuta una petición y devuelve `data`.
 *
 * `timeoutMs` es opcional: auth no lo usa (el cold start de Render puede tardar
 * hasta un minuto); el marketplace sí lo usa para no dejar la UI bloqueada.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs?: number
): Promise<T> {
  const controller = timeoutMs ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      // La sesión viaja en cookies httpOnly: el navegador las adjunta (y las
      // renueva) automáticamente. El JavaScript NUNCA lee ni envía tokens.
      credentials: 'include',
      signal: controller?.signal ?? options.signal,
      headers: {
        'Content-Type': 'application/json',
        // CsrfGuard exige este header en toda petición mutante. Un formulario
        // HTML cross-site no puede enviarlo sin pasar por el preflight CORS.
        'X-Requested-With': 'XMLHttpRequest',
        ...(options.headers ?? {}),
      },
    });
  } catch (error) {
    const timedOut = controller?.signal.aborted === true;
    throw new ApiError(
      0,
      'NETWORK_ERROR',
      timedOut
        ? 'La solicitud tardó demasiado. Verifica tu conexión e intenta de nuevo.'
        : 'No fue posible conectar con el servidor. Verifica tu conexión e intenta de nuevo.',
      error instanceof Error ? [error.message] : undefined
    );
  } finally {
    if (timer) clearTimeout(timer);
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
