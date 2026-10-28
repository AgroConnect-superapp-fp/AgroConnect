import type { Request } from 'express';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

/**
 * Extrae el token de acceso.
 *
 * Prioridad: cookie httpOnly → cabecera `Authorization: Bearer`.
 *
 * El fallback por cabecera es TEMPORAL: el frontend legacy sigue guardando
 * los tokens en `localStorage` y los envía en la cabecera. Cuando el frontend
 * migre a sesión por cookie (sin leer los tokens desde JavaScript) este
 * fallback debe eliminarse, porque en ese momento la única vía legítima
 * sería la cookie httpOnly (no accesible desde XSS).
 */
export function extractAccessToken(request: Request): string | undefined {
  const cookie: unknown = request.cookies?.[ACCESS_TOKEN_COOKIE];
  if (typeof cookie === 'string' && cookie.length > 0) {
    return cookie;
  }

  const header = request.headers.authorization;
  if (typeof header === 'string' && header.toLowerCase().startsWith('bearer ')) {
    const token = header.slice(7).trim();
    return token.length > 0 ? token : undefined;
  }

  return undefined;
}

/**
 * Extrae el token de refresco. Misma prioridad que el token de acceso:
 * cookie httpOnly primero, cabecera `Authorization` como alternativa.
 */
export function extractRefreshToken(request: Request): string | undefined {
  const cookie: unknown = request.cookies?.[REFRESH_TOKEN_COOKIE];
  if (typeof cookie === 'string' && cookie.length > 0) {
    return cookie;
  }

  const header = request.headers.authorization;
  if (typeof header === 'string' && header.toLowerCase().startsWith('bearer ')) {
    const token = header.slice(7).trim();
    return token.length > 0 ? token : undefined;
  }

  return undefined;
}
