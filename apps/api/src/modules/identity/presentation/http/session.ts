import type { Request } from 'express';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

/**
 * Extrae el token de acceso de la cookie httpOnly.
 *
 * La sesión es 100% cookie: el token NUNCA viaja por cabeceras ni cuerpos
 * legibles por JavaScript, lo que cierra la vía de robo por XSS. Si no hay
 * cookie, no hay sesión (el frontend legacy con `localStorage` ya no es
 * una vía legítima).
 */
export function extractAccessToken(request: Request): string | undefined {
  const cookie: unknown = request.cookies?.[ACCESS_TOKEN_COOKIE];
  return typeof cookie === 'string' && cookie.length > 0 ? cookie : undefined;
}

/**
 * Extrae el token de refresco de la cookie httpOnly. Mismo criterio que el
 * token de acceso: solo la cookie httpOnly es una vía legítima.
 */
export function extractRefreshToken(request: Request): string | undefined {
  const cookie: unknown = request.cookies?.[REFRESH_TOKEN_COOKIE];
  return typeof cookie === 'string' && cookie.length > 0 ? cookie : undefined;
}
