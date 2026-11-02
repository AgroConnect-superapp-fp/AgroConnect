import { Injectable } from '@nestjs/common';
import type { CookieOptions, Response } from 'express';
import type { TokenPair } from '../../domain/interfaces/TokenService';
import { env } from '../../../../shared/config/env';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './session';

const REFRESH_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * Emisión y revocación de las cookies de sesión.
 *
 * La sesión es 100% cookie `httpOnly`: el navegador la envía automáticamente y
 * el JavaScript de la página no puede leerla. Eso cierra la vía de robo de
 * token por XSS.
 *
 * Atributos:
 * - `httpOnly`: invisible para `document.cookie`.
 * - `secure`: obligatorio en producción (HTTPS). En local se desactiva porque
 *   el navegador rechazaría la cookie sobre HTTP.
 * - `sameSite`: `none` en producción porque el frontend (Vercel) y la API
 *   (Render) viven en sitios distintos; `lax` en desarrollo/pruebas.
 * - `path`: el access token se limita a `/api/v1` (toda la API) y el refresh
 *   token a `/api/v1/auth` (solo login/refresh/logout), reduciendo la
 *   superficie de envío.
 *
 * La verificación de `Origin` y el header `X-Requested-With` viven en
 * `CsrfGuard`; `SameSite=None` exige esa defensa en profundidad.
 */
@Injectable()
export class SessionCookieService {
  private readonly isProduction: boolean = env.NODE_ENV === 'production';

  setSessionCookies(response: Response, tokens: TokenPair): void {
    response.cookie(
      ACCESS_TOKEN_COOKIE,
      tokens.accessToken,
      this.options(tokens.expiresIn, '/api/v1')
    );
    response.cookie(
      REFRESH_TOKEN_COOKIE,
      tokens.refreshToken,
      this.options(REFRESH_MAX_AGE_SECONDS, '/api/v1/auth')
    );
  }

  clearSessionCookies(response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE, this.options(0, '/api/v1'));
    response.clearCookie(REFRESH_TOKEN_COOKIE, this.options(0, '/api/v1/auth'));
  }

  private options(maxAgeSeconds: number, path: string): CookieOptions {
    return {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'none' : 'lax',
      path,
      maxAge: maxAgeSeconds * 1000,
    };
  }
}
