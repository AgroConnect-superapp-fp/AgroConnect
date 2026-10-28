import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import type { TokenPair } from '../../domain/interfaces/TokenService';
import { env } from '../../../../shared/config/env';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './session';

const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * Emisión y revocación de las cookies de sesión.
 *
 * La sesión del API nuevo es una cookie `httpOnly`: el navegador la envía
 * automáticamente y el JavaScript de la página no puede leerla. Eso cierra la
 * vía de robo de token por XSS, que es el motivo por el que el frontend
 * legacy guarda los tokens en `localStorage`.
 *
 * Atributos:
 * - `httpOnly`: invisible para `document.cookie`.
 * - `secure`: solo en producción (en local el navegador la rechazaría por HTTP).
 * - `sameSite: 'lax'`: evita el envío en peticiones cross-site de terceros y
 *   bloquea CSRF en la mayoría de los casos.
 * - `path: '/'`: la cookie acompaña todas las rutas de la API.
 */
@Injectable()
export class SessionCookieService {
  private readonly isProduction: boolean = env.NODE_ENV === 'production';

  setSessionCookies(response: Response, tokens: TokenPair): void {
    const options = this.baseOptions(tokens.expiresIn);

    response.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, options);
    response.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      ...options,
      maxAge: MAX_AGE_SECONDS * 1000,
    });
  }

  clearSessionCookies(response: Response): void {
    const options = this.baseOptions(0);

    response.clearCookie(ACCESS_TOKEN_COOKIE, options);
    response.clearCookie(REFRESH_TOKEN_COOKIE, options);
  }

  private baseOptions(maxAgeSeconds: number): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'lax';
    path: string;
    maxAge: number;
  } {
    return {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds * 1000,
    };
  }
}
