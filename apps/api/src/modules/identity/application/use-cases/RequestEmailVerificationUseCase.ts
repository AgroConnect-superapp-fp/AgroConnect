import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, TOKEN_SERVICE, EMAIL_SERVICE, EMAIL_VERIFICATION_TOKEN_REPOSITORY, APP_BASE_URL } from '../tokens';
import { randomBytes, randomUUID } from 'node:crypto';
import { Email } from '../../domain/value-objects/Email';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import type { EmailVerificationTokenRepository } from '../../domain/interfaces/EmailVerificationTokenRepository';
import type { EmailService } from '../../domain/interfaces/EmailService';
import type { TokenService } from '../../domain/interfaces/TokenService';
import type { ResendVerificationInput } from '../dtos/authDtos';

export const EMAIL_VERIFICATION_TTL_HOURS = 24;

@Injectable()
export class RequestEmailVerificationUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(EMAIL_VERIFICATION_TOKEN_REPOSITORY) private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: EmailService,
    @Inject(TOKEN_SERVICE) private readonly tokenService: TokenService,
    @Inject(APP_BASE_URL) private readonly appBaseUrl: string,
  ) {}

  async execute(input: ResendVerificationInput): Promise<void> {
    const email = Email.create(input.correo);
    const user = await this.userRepository.findByEmail(email.value);

    if (!user || !user.isActive() || user.isEmailVerified()) {
      return;
    }

    await this.emailVerificationTokenRepository.invalidateUserTokens(user.id);

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000);

    await this.emailVerificationTokenRepository.create({
      id: randomUUID(),
      userId: user.id,
      tokenHash: this.tokenService.hashToken(token),
      expiresAt,
    });

    await this.emailService.sendEmailVerification({
      to: user.email,
      fullName: user.fullName,
      verifyUrl: `${this.appBaseUrl}/?verifyToken=${token}`,
      expiresInMinutes: EMAIL_VERIFICATION_TTL_HOURS * 60,
    });
  }
}
