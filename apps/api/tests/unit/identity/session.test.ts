import type { Request } from 'express';
import { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  extractAccessToken,
  extractRefreshToken,
} from '../../../src/modules/identity/presentation/http/session';
import { SessionTokenInterceptor } from '../../../src/modules/identity/presentation/http/SessionTokenInterceptor';

function requestWith(options: {
  cookies?: Record<string, string>;
  authorization?: string;
  body?: unknown;
}): Request {
  return {
    cookies: options.cookies ?? {},
    headers: options.authorization ? { authorization: options.authorization } : {},
    body: options.body,
  } as unknown as Request;
}

describe('extracción de tokens de sesión', () => {
  it('prioriza la cookie httpOnly sobre la cabecera Authorization', () => {
    const request = requestWith({
      cookies: { [ACCESS_TOKEN_COOKIE]: 'token-de-cookie' },
      authorization: 'Bearer token-de-cabecera',
    });

    expect(extractAccessToken(request)).toBe('token-de-cookie');
    expect(extractRefreshToken(request)).toBe('token-de-cabecera');
  });

  it('usa la cabecera Authorization cuando no hay cookie', () => {
    const request = requestWith({ authorization: 'Bearer token-de-cabecera' });

    expect(extractAccessToken(request)).toBe('token-de-cabecera');
    expect(extractRefreshToken(request)).toBe('token-de-cabecera');
  });

  it('acepta la cabecera con el prefijo Bearer sin distinguir mayúsculas', () => {
    expect(extractAccessToken(requestWith({ authorization: 'bearer en-minusculas' }))).toBe(
      'en-minusculas',
    );
  });

  it('devuelve undefined cuando no hay cookie ni cabecera utilizable', () => {
    expect(extractAccessToken(requestWith({}))).toBeUndefined();
    expect(extractRefreshToken(requestWith({}))).toBeUndefined();
  });

  it('ignora una cabecera que no es Bearer', () => {
    expect(extractAccessToken(requestWith({ authorization: 'Basic abc123' }))).toBeUndefined();
  });

  it('ignora un Bearer vacío', () => {
    expect(extractAccessToken(requestWith({ authorization: 'Bearer   ' }))).toBeUndefined();
  });

  it('ignora una cookie vacía', () => {
    expect(
      extractAccessToken(requestWith({ cookies: { [ACCESS_TOKEN_COOKIE]: '' } })),
    ).toBeUndefined();
    expect(
      extractRefreshToken(requestWith({ cookies: { [REFRESH_TOKEN_COOKIE]: '' } })),
    ).toBeUndefined();
  });
});

describe('SessionTokenInterceptor', () => {
  const interceptor = new SessionTokenInterceptor();

  const contextFor = (request: Request): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  it('copia el refresh token de la cookie al cuerpo', (done) => {
    const request = requestWith({
      cookies: { [REFRESH_TOKEN_COOKIE]: 'token-de-cookie' },
      body: {},
    });

    interceptor
      .intercept(contextFor(request), { handle: () => of(null) })
      .subscribe(() => {
        expect((request.body as Record<string, unknown>).refreshToken).toBe('token-de-cookie');
        done();
      });
  });

  it('no sobrescribe un refresh token ya presente en el cuerpo', (done) => {
    const request = requestWith({
      cookies: { [REFRESH_TOKEN_COOKIE]: 'token-de-cookie' },
      body: { refreshToken: 'token-del-cuerpo' },
    });

    interceptor
      .intercept(contextFor(request), { handle: () => of(null) })
      .subscribe(() => {
        expect((request.body as Record<string, unknown>).refreshToken).toBe('token-del-cuerpo');
        done();
      });
  });

  it('no falla cuando la petición no tiene cuerpo', (done) => {
    const request = requestWith({ body: undefined });

    interceptor
      .intercept(contextFor(request), { handle: () => of(null) })
      .subscribe(() => {
        expect(request.body).toBeUndefined();
        done();
      });
  });
});
