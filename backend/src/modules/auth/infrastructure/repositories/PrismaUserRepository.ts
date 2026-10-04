import type { PrismaClient, Prisma } from '@prisma/client';
import { User } from '../../domain/entities/User';
import { Role } from '../../domain/entities/Role';
import { RefreshToken } from '../../domain/entities/RefreshToken';
import type { RoleName } from '../../domain/entities/Role';
import type { RegisterUserData, UserRepository } from '../../domain/interfaces/UserRepository';
import { InfrastructureError } from '../../../../shared/domain/errors';

type UserRecord = Prisma.UserGetPayload<{ include: { role: true } }>;

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findRoleByName(name: RoleName): Promise<Role | null> {
    const record = await this.prisma.role.findUnique({ where: { name } });
    if (!record) {
      return null;
    }

    return Role.create({
      id: record.id,
      name: record.name as RoleName,
      description: record.description,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByDocument(document: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { document },
      include: { role: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { phone },
      include: { role: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    return record ? this.toDomain(record) : null;
  }

  async register(data: RegisterUserData): Promise<User> {
    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            id: data.user.id,
            fullName: data.user.fullName,
            document: data.user.document,
            email: data.user.email,
            phone: data.user.phone,
            passwordHash: data.user.passwordHash,
            roleId: data.user.roleId,
            acceptsDataProcessing: data.user.acceptsDataProcessing,
          },
          include: { role: true },
        });

        if (data.producerProfile) {
          const profile = await tx.producerProfile.create({
            data: {
              userId: user.id,
              farmName: data.producerProfile.farmName,
              municipality: data.producerProfile.municipality,
              village: data.producerProfile.village,
            },
          });

          const { latitude, longitude } = data.producerProfile;
          if (latitude !== undefined && longitude !== undefined) {
            await tx.$executeRaw`
              UPDATE producer_profiles
              SET coordenadas = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
              WHERE id = ${profile.id}::uuid
            `;
          }
        }

        if (data.companyProfile) {
          await tx.companyProfile.create({
            data: {
              userId: user.id,
              companyName: data.companyProfile.companyName,
              nit: data.companyProfile.nit,
              address: data.companyProfile.address ?? null,
            },
          });
        }

        await tx.refreshToken.create({
          data: {
            userId: user.id,
            tokenHash: data.refreshToken.tokenHash,
            expiresAt: data.refreshToken.expiresAt,
          },
        });

        return user;
      });

      return this.toDomain(created);
    } catch (error) {
      throw new InfrastructureError('No fue posible completar el registro', error);
    }
  }

  async saveRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    const record = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!record) {
      return null;
    }

    return RefreshToken.create({
      id: record.id,
      userId: record.userId,
      tokenHash: record.tokenHash,
      expiresAt: record.expiresAt,
      revoked: record.revoked,
      createdAt: record.createdAt,
    });
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revoked: false },
      data: { revoked: true },
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  async rotateRefreshToken(
    currentTokenHash: string,
    nextToken: { tokenHash: string; expiresAt: Date },
  ): Promise<void> {
    const current = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: currentTokenHash },
    });

    if (!current) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: current.id },
        data: { revoked: true },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: current.userId,
          tokenHash: nextToken.tokenHash,
          expiresAt: nextToken.expiresAt,
        },
      }),
    ]);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  private toDomain(record: UserRecord): User {
    return User.create({
      id: record.id,
      fullName: record.fullName,
      document: record.document,
      email: record.email,
      phone: record.phone,
      passwordHash: record.passwordHash,
      roleId: record.roleId,
      roleName: record.role.name as RoleName,
      status: record.status,
      acceptsDataProcessing: record.acceptsDataProcessing,
      emailVerifiedAt: record.emailVerifiedAt,
      createdAt: record.createdAt,
    });
  }
}
