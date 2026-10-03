import { InvalidTokenError } from '../../domain/errors/AuthErrors';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import type { EmailVerificationTokenRepository } from '../../domain/interfaces/EmailVerificationTokenRepository';
import type { TokenService } from '../../domain/interfaces/TokenService';
import type { VerifyEmailInput } from '../dtos/authDtos';

export class VerifyEmailUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: VerifyEmailInput): Promise<void> {
    const tokenHash = this.tokenService.hashToken(input.token);
    const storedToken = await this.emailVerificationTokenRepository.findByHash(tokenHash);

    if (!storedToken || !storedToken.isUsable()) {
      throw new InvalidTokenError('El enlace de verificación es inválido o expiró');
    }

    const user = await this.userRepository.findById(storedToken.userId);
    if (!user || !user.isActive()) {
      throw new InvalidTokenError('El enlace de verificación es inválido o expiró');
    }

    await this.userRepository.markEmailVerified(user.id);
    await this.emailVerificationTokenRepository.markUsed(storedToken.id);
  }
}
