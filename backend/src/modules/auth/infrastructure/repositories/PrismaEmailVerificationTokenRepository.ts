import type { PrismaClient } from '@prisma/client';
import { EmailVerificationToken } from '../../domain/entities/EmailVerificationToken';
import type {
  NewEmailVerificationTokenData,
  EmailVerificationTokenRepository,
} from '../../domain/interfaces/EmailVerificationTokenRepository';

export class PrismaEmailVerificationTokenRepository implements EmailVerificationTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: NewEmailVerificationTokenData): Promise<void> {
    await this.prisma.emailVerificationToken.create({
      data: {
        id: data.id,
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findByHash(tokenHash: string): Promise<EmailVerificationToken | null> {
    const record = await this.prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
    if (!record) {
      return null;
    }

    return EmailVerificationToken.create({
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      usedAt: record.usedAt,
      createdAt: record.createdAt,
    });
  }

  async markUsed(id: string): Promise<void> {
    await this.prisma.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  }

  async invalidateUserTokens(userId: string): Promise<void> {
    await this.prisma.emailVerificationToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }
}
