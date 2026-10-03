import { randomBytes, randomUUID } from 'node:crypto';
import { Email } from '../../domain/value-objects/Email';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import type { EmailVerificationTokenRepository } from '../../domain/interfaces/EmailVerificationTokenRepository';
import type { EmailService } from '../../domain/interfaces/EmailService';
import type { TokenService } from '../../domain/interfaces/TokenService';
import type { ResendVerificationInput } from '../dtos/authDtos';

export const EMAIL_VERIFICATION_TTL_HOURS = 24;

export class RequestEmailVerificationUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailVerificationTokenRepository: EmailVerificationTokenRepository,
    private readonly emailService: EmailService,
    private readonly tokenService: TokenService,
    private readonly appBaseUrl: string,
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
