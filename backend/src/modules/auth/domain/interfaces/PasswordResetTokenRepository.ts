import type { PasswordResetToken } from '../entities/PasswordResetToken';

export interface NewPasswordResetTokenData {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

export interface PasswordResetTokenRepository {
  create(data: NewPasswordResetTokenData): Promise<void>;
  findByHash(tokenHash: string): Promise<PasswordResetToken | null>;
  markUsed(id: string): Promise<void>;
  invalidateUserTokens(userId: string): Promise<void>;
}
