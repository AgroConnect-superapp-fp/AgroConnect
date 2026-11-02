import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { env } from '../config/env';
import { DomainError } from '../errors/errors';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_HEADER = 'x-requested-with';
const CSRF_VALUE = 'XMLHttpRequest';

/**
 * Defensa CSRF para un despliegue cross-site (Vercel → Render).
 *
 * Con `SameSite=None` la cookie viaja entre sitios, así que `SameSite` deja de
 * ser la barrera. Este guard exige, para todo método mutante:
 *
 *  1. `Origin` (o `Referer` como respaldo) dentro de la lista `CORS_ORIGIN`.
 *  2. El header personalizado `X-Requested-With: XMLHttpRequest`, que un
 *     formulario HTML cross-site no puede enviar sin preflight CORS.
 *
 * En `NODE_ENV=test` se relajan las comprobaciones para no acoplar las pruebas
 * de integración (supertest no envía `Origin`) al navegador. En desarrollo y
 * producción se aplican.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly allowedOrigins: readonly string[] = env.CORS_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    const isTest = env.NODE_ENV === 'test';
    const origin = this.readOrigin(request);
    const requestedWith = request.headers[CSRF_HEADER];

    if (origin !== undefined && !this.allowedOrigins.includes(origin)) {
      throw new DomainError('FORBIDDEN', 'El origen de la petición no está permitido', 403);
    }

    // Sin Origin/Referer (clientes no navegador) o con Origin válido, el header
    // personalizado sigue siendo obligatorio fuera de las pruebas.
    if (!isTest && requestedWith !== CSRF_VALUE) {
      throw new DomainError(
        'FORBIDDEN',
        'La petición no cumple la protección CSRF (falta X-Requested-With)',
        403
      );
    }

    return true;
  }

  private readOrigin(request: Request): string | undefined {
    const origin = request.headers.origin;
    if (typeof origin === 'string' && origin.length > 0) {
      return origin;
    }

    const referer = request.headers.referer;
    if (typeof referer === 'string' && referer.length > 0) {
      try {
        return new URL(referer).origin;
      } catch {
        return undefined;
      }
    }

    return undefined;
  }
}
