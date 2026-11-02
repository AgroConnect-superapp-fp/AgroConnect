import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE, PASSWORD_RESET_TOKEN_REPOSITORY } from '../tokens';
import { InvalidTokenError } from '../../domain/errors/AuthErrors';
import { Password } from '../../domain/value-objects/Password';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import type { PasswordResetTokenRepository } from '../../domain/interfaces/PasswordResetTokenRepository';
import type { PasswordHasher } from '../../domain/interfaces/PasswordHasher';
import type { TokenService } from '../../domain/interfaces/TokenService';
import type { ResetPasswordInput } from '../dtos/authDtos';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY) private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
  ) {}

  async execute(input: ResetPasswordInput): Promise<void> {
    const tokenHash = this.tokenService.hashToken(input.token);
    const storedToken = await this.passwordResetTokenRepository.findByHash(tokenHash);

    if (!storedToken || !storedToken.isUsable()) {
      throw new InvalidTokenError('El enlace de recuperación es inválido o expiró');
    }

    const user = await this.userRepository.findById(storedToken.userId);
    if (!user || !user.isActive()) {
      throw new InvalidTokenError('El enlace de recuperación es inválido o expiró');
    }

    const password = Password.create(input.password);
    const passwordHash = await this.passwordHasher.hash(password.value);

    // Consumir primero: dos solicitudes concurrentes con el mismo enlace no pueden ganar ambas.
    const consumed = await this.passwordResetTokenRepository.consume(storedToken.id);
    if (!consumed) {
      throw new InvalidTokenError('El enlace de recuperación es inválido o expiró');
    }

    await this.userRepository.updatePassword(user.id, passwordHash);
    await this.userRepository.revokeAllUserTokens(user.id);
  }
}
