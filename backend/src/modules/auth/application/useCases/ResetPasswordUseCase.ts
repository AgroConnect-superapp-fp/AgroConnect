import { InvalidTokenError } from '../../domain/errors/AuthErrors';
import { Password } from '../../domain/value-objects/Password';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import type { PasswordResetTokenRepository } from '../../domain/interfaces/PasswordResetTokenRepository';
import type { PasswordHasher } from '../../domain/interfaces/PasswordHasher';
import type { TokenService } from '../../domain/interfaces/TokenService';
import type { ResetPasswordInput } from '../dtos/authDtos';

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
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

    await this.userRepository.updatePassword(user.id, passwordHash);
    await this.passwordResetTokenRepository.markUsed(storedToken.id);
    await this.userRepository.revokeAllUserTokens(user.id);
  }
}
