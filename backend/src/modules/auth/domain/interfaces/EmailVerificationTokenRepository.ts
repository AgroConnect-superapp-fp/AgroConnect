import type { EmailVerificationToken } from '../entities/EmailVerificationToken';

export interface NewEmailVerificationTokenData {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface EmailVerificationTokenRepository {
  create(data: NewEmailVerificationTokenData): Promise<void>;
  findByHash(tokenHash: string): Promise<EmailVerificationToken | null>;
  markUsed(id: string): Promise<void>;
  invalidateUserTokens(userId: string): Promise<void>;
}
