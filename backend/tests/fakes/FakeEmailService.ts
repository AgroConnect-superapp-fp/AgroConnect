import type {
  EmailService,
  EmailVerificationEmail,
  PasswordResetEmail,
} from '../../src/modules/auth/domain/interfaces/EmailService';

export class FakeEmailService implements EmailService {
  sent: PasswordResetEmail[] = [];
  sentVerifications: EmailVerificationEmail[] = [];

  async sendPasswordReset(email: PasswordResetEmail): Promise<void> {
    this.sent.push(email);
  }

  async sendEmailVerification(email: EmailVerificationEmail): Promise<void> {
    this.sentVerifications.push(email);
  }
}
