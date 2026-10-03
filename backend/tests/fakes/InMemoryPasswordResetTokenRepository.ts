import { PasswordResetToken } from '../../src/modules/auth/domain/entities/PasswordResetToken';
import type {
  NewPasswordResetTokenData,
  PasswordResetTokenRepository,
} from '../../src/modules/auth/domain/interfaces/PasswordResetTokenRepository';

export class InMemoryPasswordResetTokenRepository implements PasswordResetTokenRepository {
  tokens: PasswordResetToken[] = [];

  async create(data: NewPasswordResetTokenData): Promise<void> {
    this.tokens.push(
      PasswordResetToken.create({
        id: data.id,
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        usedAt: null,
        createdAt: new Date(),
      }),
    );
  }

  async findByHash(tokenHash: string): Promise<PasswordResetToken | null> {
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

  private cloneWithUsedAt(token: PasswordResetToken, usedAt: Date): PasswordResetToken {
    return PasswordResetToken.create({
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      usedAt,
      createdAt: token.createdAt,
    });
  }
}
