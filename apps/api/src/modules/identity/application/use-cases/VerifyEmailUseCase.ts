import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, TOKEN_SERVICE, EMAIL_VERIFICATION_TOKEN_REPOSITORY } from '../tokens';
import { InvalidTokenError } from '../../domain/errors/AuthErrors';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import type { EmailVerificationTokenRepository } from '../../domain/interfaces/EmailVerificationTokenRepository';
import type { TokenService } from '../../domain/interfaces/TokenService';
import type { VerifyEmailInput } from '../dtos/authDtos';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY) private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
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

    const consumed = await this.emailVerificationTokenRepository.consume(storedToken.id);
    if (!consumed) {
      throw new InvalidTokenError('El enlace de verificación es inválido o expiró');
    }

    await this.userRepository.markEmailVerified(user.id);
  }
}
