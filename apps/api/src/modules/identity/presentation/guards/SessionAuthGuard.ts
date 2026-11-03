import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedRequest } from '../../../../shared/http/authenticated-user';
import { TOKEN_SERVICE, USER_REPOSITORY } from '../../application/tokens';
import { EmailNotVerifiedError, InvalidTokenError } from '../../domain/errors/AuthErrors';
import type { TokenService } from '../../domain/interfaces/TokenService';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import { extractAccessToken } from '../http/session';

/**
 * Valida la sesión cookie-only en endpoints protegidos.
 *
 * - Lee `access_token` de la cookie httpOnly (nunca de Authorization/localStorage).
 * - Verifica firma, expiración, issuer y audience con `TokenService`.
 * - Carga el usuario y exige estado ACTIVO y correo verificado.
 * - Adjunta `request.user` para que el controller atribuya la operación.
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractAccessToken(request);

    if (!token) {
      throw new InvalidTokenError('Tu sesión expiró. Inicia sesión de nuevo.');
    }

    let payload;
    try {
      payload = this.tokenService.verifyAccessToken(token);
    } catch {
      throw new InvalidTokenError('Tu sesión expiró. Inicia sesión de nuevo.');
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user || !user.isActive() || user.roleName !== payload.role) {
      throw new InvalidTokenError('Tu sesión no es válida. Inicia sesión de nuevo.');
    }

    if (!user.isEmailVerified()) {
      throw new EmailNotVerifiedError();
    }

    request.user = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.roleName,
    };

    return true;
  }
}
