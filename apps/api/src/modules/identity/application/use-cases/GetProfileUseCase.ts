import { DomainError } from '../../../../shared/errors/errors';
import type { ProfileSnapshot, UserRepository } from '../../domain/interfaces/UserRepository';

export class GetProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string): Promise<ProfileSnapshot> {
    const profile = await this.userRepository.findProfileById(userId);
    if (!profile) {
      throw new DomainError('NOT_FOUND', 'No se encontró el perfil del usuario', 404);
    }

    return profile;
  }
}
