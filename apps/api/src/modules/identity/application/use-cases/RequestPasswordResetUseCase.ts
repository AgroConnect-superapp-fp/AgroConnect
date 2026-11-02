import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, TOKEN_SERVICE, EMAIL_SERVICE, PASSWORD_RESET_TOKEN_REPOSITORY, APP_BASE_URL } from '../tokens';
import { randomBytes, randomUUID } from 'node:crypto';
import { Email } from '../../domain/value-objects/Email';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import type { PasswordResetTokenRepository } from '../../domain/interfaces/PasswordResetTokenRepository';
import type { EmailService } from '../../domain/interfaces/EmailService';
import type { TokenService } from '../../domain/interfaces/TokenService';
import type { ForgotPasswordInput } from '../dtos/authDtos';

export const PASSWORD_RESET_TTL_MINUTES = 30;

@Injectable()
export class RequestPasswordResetUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_RESET_TOKEN_REPOSITORY) private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailService,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(APP_BASE_URL) private readonly appBaseUrl: string,
  ) {}

  async execute(input: ForgotPasswordInput): Promise<void> {
    const email = Email.create(input.correo);
    const user = await this.userRepository.findByEmail(email.value);

    if (!user || !user.isActive()) {
      return;
    }

    await this.passwordResetTokenRepository.invalidateUserTokens(user.id);

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);

    await this.passwordResetTokenRepository.create({
      id: randomUUID(),
      userId: user.id,
      tokenHash: this.tokenService.hashToken(token),
      expiresAt,
    });

    await this.emailService.sendPasswordReset({
      to: user.email,
      fullName: user.fullName,
      resetUrl: `${this.appBaseUrl}/?resetToken=${token}`,
      expiresInMinutes: PASSWORD_RESET_TTL_MINUTES,
    });
  }
}
