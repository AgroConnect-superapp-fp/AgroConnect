import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DomainError } from '../../../../shared/errors/errors';
import type { AuthenticatedRequest } from '../../../../shared/http/authenticated-user';
import { ROLES_KEY } from './roles.decorator';

/**
 * Rechaza la petición cuando el rol de la sesión no está entre los exigidos.
 *
 * - Sin metadatos `@Roles(...)` el guard deja pasar (comportamiento neutro).
 * - Sin sesión responde 401; con rol no autorizado responde 403.
 *
 * Debe ejecutarse DESPUÉS de `SessionAuthGuard`: es el guard que adjunta
 * `request.user` con el rol del usuario autenticado.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<readonly string[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const role = request.user?.role;

    if (!role) {
      throw new DomainError(
        'UNAUTHORIZED',
        'Se requiere una sesión autenticada para esta operación',
        401,
      );
    }

    if (!required.includes(role)) {
      throw new DomainError(
        'FORBIDDEN',
        'Tu rol no tiene permisos para realizar esta operación',
        403,
      );
    }

    return true;
  }
}
