import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { extractRefreshToken } from './session';

/**
 * Copia el token de refresco de la cookie httpOnly al cuerpo de la petición.
 *
 * El interceptor se ejecuta ANTES que los pipes de validación, de modo que el
 * esquema `refreshSchema` del contrato compartido ve el token tanto si llega
 * en el cuerpo (frontend legacy) como si llega en la cookie (frontend nuevo,
 * con cookie httpOnly). Si no hay ninguno de los dos, el esquema falla con
 * 422 `VALIDATION_ERROR`, igual que el legacy.
 */
@Injectable()
export class SessionTokenInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const body = request.body as Record<string, unknown> | undefined;

    if (body && typeof body === 'object' && !body.refreshToken) {
      const token = extractRefreshToken(request);
      if (token) {
        body.refreshToken = token;
      }
    }

    return next.handle();
  }
}
