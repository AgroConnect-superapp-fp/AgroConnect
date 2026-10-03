import { EmailVerificationToken } from '../../src/modules/auth/domain/entities/EmailVerificationToken';
import type {
  NewEmailVerificationTokenData,
  EmailVerificationTokenRepository,
} from '../../src/modules/auth/domain/interfaces/EmailVerificationTokenRepository';

export class InMemoryEmailVerificationTokenRepository
  implements EmailVerificationTokenRepository
{
  tokens: EmailVerificationToken[] = [];

  async create(data: NewEmailVerificationTokenData): Promise<void> {
    this.tokens.push(
      EmailVerificationToken.create({
        id: data.id,
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        usedAt: null,
        createdAt: new Date(),
      }),
    );
  }

  async findByHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    return this.tokens.find((token) => token.tokenHash === tokenHash) ?? null;
  }

  async markUsed(id: string): Promise<void> {
    this.tokens = this.tokens.map((token) =>
      token.id === id ? this.cloneWithUsedAt(token, new Date()) : token,
    );
  }

  async invalidateUserTokens(userId: string): Promise<void> {
    this.tokens = this.tokens.map((token) =>
      token.userId === userId && token.usedAt === null
        ? this.cloneWithUsedAt(token, new Date())
        : token,
    );
  }

  private cloneWithUsedAt(token: EmailVerificationToken, usedAt: Date): EmailVerificationToken {
    return EmailVerificationToken.create({
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      usedAt,
      createdAt: token.createdAt,
    });
  }
}
