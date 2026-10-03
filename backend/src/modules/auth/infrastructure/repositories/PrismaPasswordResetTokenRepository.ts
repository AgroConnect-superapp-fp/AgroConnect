import type { PrismaClient } from '@prisma/client';
import { PasswordResetToken } from '../../domain/entities/PasswordResetToken';
import type {
  NewPasswordResetTokenData,
  PasswordResetTokenRepository,
} from '../../domain/interfaces/PasswordResetTokenRepository';

export class PrismaPasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: NewPasswordResetTokenData): Promise<void> {
    await this.prisma.passwordResetToken.create({
      data: {
        id: data.id,
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findByHash(tokenHash: string): Promise<PasswordResetToken | null> {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record) {
      return null;
    }

    return PasswordResetToken.create({
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      usedAt: record.usedAt,
      createdAt: record.createdAt,
    });
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async invalidateUserTokens(userId: string): Promise<void> {
    await this.prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
