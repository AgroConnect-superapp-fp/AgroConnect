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
/**
 * Resultado de renovar la cookie de acceso:
 * - `refreshed`: hay sesión nueva y la petición original puede reintentarse.
 * - `rejected`: el servidor rechazó la cookie (401/403); la sesión terminó.
 * - `unavailable`: no se pudo consultar (red, timeout, 5xx); la cookie puede
 *   seguir siendo válida y NO debe anunciarse una sesión expirada.
 */
type RefreshOutcome = 'refreshed' | 'rejected' | 'unavailable';

let refreshInFlight: Promise<RefreshOutcome> | null = null;

/**
 * Renueva la cookie de acceso una sola vez aunque varias peticiones reciban
 * 401 al mismo tiempo. El refresh token viaja en la cookie httpOnly; el
 * navegador la adjunta y la rota, sin que JavaScript lea ningún token.
 */
async function refreshAccessToken(): Promise<RefreshOutcome> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      signal: AbortSignal.timeout(15_000),
    })
      .then((response): RefreshOutcome => {
        if (response.ok) return 'refreshed';
        if (response.status === 401 || response.status === 403) return 'rejected';
        return 'unavailable';
      })
      .catch((): RefreshOutcome => 'unavailable')
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

function buildHeaders(options: RequestInit): Headers {
  const headers = new Headers(options.headers);
  // CsrfGuard exige este header en peticiones mutantes. Un formulario HTML
  // cross-site no puede enviarlo sin pasar por el preflight CORS.
  headers.set('X-Requested-With', 'XMLHttpRequest');
  // Content-Type solo cuando hay body: en GET provoca un preflight innecesario.
  if (options.body !== undefined && options.body !== null) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

function shouldAttemptRefresh(path: string): boolean {
  if (path === '/api/v1/auth/refresh') return false;
  if (!path.startsWith('/api/v1/auth/')) return true;
  return path === '/api/v1/auth/logout';
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs?: number
): Promise<T> {
  const controller = timeoutMs ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  const requestInit: RequestInit = {
    ...options,
    credentials: 'include',
    signal: controller?.signal ?? options.signal,
    headers: buildHeaders(options),
  };

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, requestInit);

    if (response.status === 401 && shouldAttemptRefresh(path)) {
      const outcome = await refreshAccessToken();
      if (outcome === 'refreshed') {
        response = await fetch(`${API_URL}${path}`, requestInit);
      } else if (outcome === 'rejected' && typeof window !== 'undefined') {
        // Solo un rechazo explícito del servidor cierra la sesión local. Si la
        // red falló, el 401 original se propaga sin borrar la sesión.
        window.dispatchEvent(new Event('agroconnect:session-expired'));
      }
    }
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
