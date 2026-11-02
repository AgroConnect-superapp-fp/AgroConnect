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
  /** Marca el token como usado solo si aún no lo estaba; `false` si otro proceso lo consumió primero. */
  consume(id: string): Promise<boolean>;
  invalidateUserTokens(userId: string): Promise<void>;
}
