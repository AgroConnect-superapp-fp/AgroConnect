import { SetMetadata } from '@nestjs/common';
import type { RoleName } from '../../domain/entities/Role';

/**
 * Clave de metadatos con los roles exigidos por un handler o un controlador.
 */
export const ROLES_KEY = 'agroconnect:roles';

/**
 * Declara los roles autorizados para un endpoint.
 *
 * Uso: `@Roles('productor', 'administrador')`.
 *
 * El guard (`RolesGuard`) es SOLO un rechazo temprano: evita gastar trabajo
 * en una petición que ya es inválida. La validación autoritativa del rol vive
 * en la capa de aplicación (casos de uso), que es la que protege el dominio
 * aunque el caso de uso se invoque por otro adaptador.
 */
export const Roles = (...roles: readonly RoleName[]) => SetMetadata(ROLES_KEY, roles);
