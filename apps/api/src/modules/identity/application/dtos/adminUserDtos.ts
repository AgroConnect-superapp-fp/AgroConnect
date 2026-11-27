import type { User, UserStatus } from '../../domain/entities/User';
import type { RoleName } from '../../domain/entities/Role';

/**
 * Actor mínimo para autorizar operaciones administrativas.
 *
 * Se toma SIEMPRE de la sesión (`request.user`), nunca del cuerpo ni de la
 * ruta. El caso de uso lo verifica de nuevo como defensa en profundidad.
 */
export interface AdminUserActor {
  id: string;
  role: string;
  correlationId?: string;
}

/**
 * Proyección administrativa de un usuario.
 *
 * Excluye a propósito `passwordHash`, tokens y cualquier dato de sesión. Los
 * nombres siguen el contrato compartido (`AdminUser` en
 * `@agroconnect/contracts`).
 */
export interface AdminUserView {
  id: string;
  nombre: string;
  correo: string;
  documento: string;
  celular: string;
  rol: RoleName;
  estado: UserStatus;
  verificado: boolean;
  fechaRegistro: string;
}

export function toAdminUserView(user: User): AdminUserView {
  return {
    id: user.id,
    nombre: user.fullName,
    correo: user.email,
    documento: user.document,
    celular: user.phone,
    rol: user.roleName,
    estado: user.status,
    verificado: user.isEmailVerified(),
    fechaRegistro: user.createdAt.toISOString(),
  };
}
