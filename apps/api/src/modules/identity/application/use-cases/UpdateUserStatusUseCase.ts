import { DomainError } from '../../../../shared/errors/errors';
import { USER_STATUSES, type UserStatus } from '../../domain/entities/User';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import { toAdminUserView, type AdminUserActor, type AdminUserView } from '../dtos/adminUserDtos';

/**
 * Cambia el estado de una cuenta.
 *
 * Reglas de negocio:
 *  - Solo un administrador puede ejecutarlo.
 *  - Nadie puede cambiar su propio estado (evita autobloqueos accidentales).
 *  - No se puede desactivar/suspender al último administrador ACTIVO.
 *  - La actualización y la revocación de refresh tokens son atómicas en el
 *    repositorio; el access token queda inutilizado en la siguiente petición
 *    porque `SessionAuthGuard` recarga estado y rol desde la base.
 */
export class UpdateUserStatusUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(actor: AdminUserActor, userId: string, status: UserStatus): Promise<AdminUserView> {
    if (actor.role !== 'administrador') {
      throw new DomainError('FORBIDDEN', 'Solo un administrador puede gestionar usuarios', 403);
    }

    if (!(USER_STATUSES as readonly string[]).includes(status)) {
      throw new DomainError('VALIDATION_ERROR', 'El estado no es válido', 422);
    }

    const target = await this.userRepository.findById(userId);
    if (!target) {
      throw new DomainError('NOT_FOUND', 'El usuario no existe', 404);
    }

    if (target.id === actor.id) {
      throw new DomainError(
        'CONFLICT',
        'No puedes cambiar tu propio estado. Pide a otro administrador que realice el cambio.',
        409,
      );
    }

    const result = await this.userRepository.updateStatusPreservingAdminContinuity(
      target.id,
      status,
    );

    if (result.outcome === 'NOT_FOUND') {
      throw new DomainError('NOT_FOUND', 'El usuario no existe', 404);
    }

    if (result.outcome === 'LAST_ACTIVE_ADMIN') {
      throw new DomainError(
        'CONFLICT',
        'No es posible desactivar o suspender al último administrador activo',
        409,
      );
    }

    return toAdminUserView(result.user);
  }
}
