import { DomainError } from '../../../../shared/errors/errors';
import { Role } from '../../domain/entities/Role';
import { RoleNotFoundError } from '../../domain/errors/AuthErrors';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import { toAdminUserView, type AdminUserActor, type AdminUserView } from '../dtos/adminUserDtos';

/**
 * Cambia el rol de una cuenta.
 *
 * Reglas de negocio:
 *  - Solo un administrador puede ejecutarlo.
 *  - Nadie puede cambiar su propio rol.
 *  - Un rol inexistente responde `422 ROLE_NOT_FOUND`.
 *  - No se puede quitar el rol `administrador` al último administrador ACTIVO.
 *  - Todo cambio efectivo revoca los refresh tokens del usuario en la misma
 *    transacción. El access token deja de servir en la siguiente petición
 *    porque `SessionAuthGuard` compara el rol del token con el de la base.
 */
export class UpdateUserRoleUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(actor: AdminUserActor, userId: string, role: string): Promise<AdminUserView> {
    if (actor.role !== 'administrador') {
      throw new DomainError('FORBIDDEN', 'Solo un administrador puede gestionar usuarios', 403);
    }

    const target = await this.userRepository.findById(userId);
    if (!target) {
      throw new DomainError('NOT_FOUND', 'El usuario no existe', 404);
    }

    if (target.id === actor.id) {
      throw new DomainError(
        'CONFLICT',
        'No puedes cambiar tu propio rol. Pide a otro administrador que realice el cambio.',
        409,
      );
    }

    if (!Role.isValidName(role)) {
      throw new RoleNotFoundError(role);
    }

    const newRole = await this.userRepository.findRoleByName(role);
    if (!newRole) {
      throw new RoleNotFoundError(role);
    }

    // Reaplicar el mismo rol es idempotente y no debe cerrar sesiones abiertas.
    if (target.roleName === newRole.name) {
      return toAdminUserView(target);
    }

    if (
      newRole.requiresProducerProfile() ||
      newRole.requiresCompanyProfile() ||
      newRole.requiresTransporterProfile()
    ) {
      const presence = await this.userRepository.findProfilePresenceById(target.id);
      const hasRequiredProfile =
        presence !== null &&
        ((newRole.requiresProducerProfile() && presence.producer) ||
          (newRole.requiresCompanyProfile() && presence.company) ||
          (newRole.requiresTransporterProfile() && presence.transporter));

      if (!hasRequiredProfile) {
        throw new DomainError(
          'CONFLICT',
          `No puedes asignar el rol "${newRole.name}" sin el perfil correspondiente. El usuario debe completar su perfil antes del cambio.`,
          409,
        );
      }
    }

    const result = await this.userRepository.updateRolePreservingAdminContinuity(
      target.id,
      newRole.id,
      newRole.name,
    );

    if (result.outcome === 'NOT_FOUND') {
      throw new DomainError('NOT_FOUND', 'El usuario no existe', 404);
    }

    if (result.outcome === 'LAST_ACTIVE_ADMIN') {
      throw new DomainError(
        'CONFLICT',
        'No es posible quitar el rol de administrador al último administrador activo',
        409,
      );
    }

    return toAdminUserView(result.user);
  }
}
