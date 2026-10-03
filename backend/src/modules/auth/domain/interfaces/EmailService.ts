export interface PasswordResetEmail {
  to: string;
  fullName: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface EmailVerificationEmail {
  to: string;
  fullName: string;
  verifyUrl: string;
  expiresInMinutes: number;
}

export interface EmailService {
  sendPasswordReset(email: PasswordResetEmail): Promise<void>;
  sendEmailVerification(email: EmailVerificationEmail): Promise<void>;
}
