import { DomainError } from '../../../../shared/errors/errors';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import { toAdminUserView, type AdminUserActor, type AdminUserView } from '../dtos/adminUserDtos';

/** Obtiene el detalle administrativo de un usuario (solo administrador). */
export class GetAdminUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(actor: AdminUserActor, userId: string): Promise<AdminUserView> {
    if (actor.role !== 'administrador') {
      throw new DomainError('FORBIDDEN', 'Solo un administrador puede gestionar usuarios', 403);
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new DomainError('NOT_FOUND', 'El usuario no existe', 404);
    }

    return toAdminUserView(user);
  }
}
