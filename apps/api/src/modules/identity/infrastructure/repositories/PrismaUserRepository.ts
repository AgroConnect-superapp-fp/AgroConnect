import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../../../generated/prisma/client';
import type { Prisma } from '../../../../generated/prisma/client';
import { User } from '../../domain/entities/User';
import { Role } from '../../domain/entities/Role';
import { RefreshToken } from '../../domain/entities/RefreshToken';
import type { RoleName } from '../../domain/entities/Role';
import type {
  CompanyProfileUpdate,
  ProfileSnapshot,
  ProducerProfileUpdate,
  RegisterUserData,
  TransporterProfileUpdate,
  UserRepository,
} from '../../domain/interfaces/UserRepository';
import { InfrastructureError } from '../../../../shared/errors/errors';
import { uniqueViolationTarget } from '../../../../shared/infrastructure/prismaErrors';
import {
  DocumentAlreadyExistsError,
  PlateAlreadyExistsError,
  EmailAlreadyExistsError,
  NitAlreadyExistsError,
  PhoneAlreadyExistsError,
  UserAlreadyExistsError,
} from '../../domain/errors/AuthErrors';

type UserRecord = Prisma.UserGetPayload<{ include: { role: true } }>;

@Injectable()
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
              companyType: data.companyProfile.companyType,
              department: data.companyProfile.department ?? null,
              municipality: data.companyProfile.municipality ?? null,
            },
          });
        }

        if (data.transporterProfile) {
          await tx.transporterProfile.create({
            data: {
              userId: user.id,
              vehicleType: data.transporterProfile.vehicleType,
              plate: data.transporterProfile.plate,
              capacityKg: data.transporterProfile.capacityKg,
              coverageMunicipalities: data.transporterProfile.coverageMunicipalities,
              coldChain: data.transporterProfile.coldChain,
              soatExpiresAt: data.transporterProfile.soatExpiresAt,
              licenseExpiresAt: data.transporterProfile.licenseExpiresAt,
            },
          });
        }

        if (data.refreshToken) {
          await tx.refreshToken.create({
            data: {
              userId: user.id,
              tokenHash: data.refreshToken.tokenHash,
              expiresAt: data.refreshToken.expiresAt,
              familyId: data.refreshToken.familyId,
              generation: data.refreshToken.generation,
            },
          });
        }

        return user;
      });

      return this.toDomain(created);
    } catch (error) {
      throw this.mapRegisterError(error);
    }
  }

  async saveRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    familyId: string;
    generation: number;
  }): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
        familyId: data.familyId,
        generation: data.generation,
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
      familyId: record.familyId,
      generation: record.generation,
      expiresAt: record.expiresAt,
      revoked: record.revoked,
      rotatedAt: record.rotatedAt,
      createdAt: record.createdAt,
    });
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revoked: false },
      data: { revoked: true },
    });
  }

  async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revoked: false },
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
    nextToken: {
      tokenHash: string;
      expiresAt: Date;
      familyId: string;
      generation: number;
    },
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.refreshToken.findUnique({
        where: { tokenHash: currentTokenHash },
      });
      if (!current) {
        return false;
      }

      // Reuso: el token ya fue rotado o revocado. Se revoca la familia
      // completa para cortar una posible cadena robada.
      if (current.revoked || current.rotatedAt !== null) {
        await tx.refreshToken.updateMany({
          where: { familyId: current.familyId, revoked: false },
          data: { revoked: true },
        });
        return false;
      }

      if (current.expiresAt.getTime() <= Date.now()) {
        return false;
      }

      const revoked = await tx.refreshToken.updateMany({
        where: { id: current.id, revoked: false, rotatedAt: null },
        data: { revoked: true, rotatedAt: new Date() },
      });
      if (revoked.count !== 1) {
        // Dos pestañas pueden leer el mismo token antes de que una lo rote.
        // Si otra petición acaba de rotarlo, NO revocamos la familia: eso
        // invalidaría el token nuevo de la petición ganadora. Solo tratamos
        // como reuso una rotación antigua fuera de la ventana de gracia.
        const latest = await tx.refreshToken.findUnique({
          where: { id: current.id },
        });
        const rotatedRecently =
          latest?.rotatedAt !== null &&
          latest?.rotatedAt !== undefined &&
          Date.now() - latest.rotatedAt.getTime() < 30_000;

        if (!rotatedRecently) {
          await tx.refreshToken.updateMany({
            where: { familyId: current.familyId, revoked: false },
            data: { revoked: true },
          });
        }
        return false;
      }

      await tx.refreshToken.create({
        data: {
          userId: current.userId,
          tokenHash: nextToken.tokenHash,
          expiresAt: nextToken.expiresAt,
          familyId: nextToken.familyId,
          generation: nextToken.generation,
        },
      });
      return true;
    });
  }

  async findProfileById(id: string): Promise<ProfileSnapshot | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: true,
        producerProfile: true,
        companyProfile: true,
        transporterProfile: true,
      },
    });
    if (!record) {
      return null;
    }

    const snapshot: ProfileSnapshot = { user: this.toDomain(record).toPublicProfile() };

    if (record.producerProfile) {
      const coordinatesRows = await this.prisma.$queryRaw<
        Array<{ lat: number | null; lng: number | null }>
      >`
        SELECT ST_Y(coordenadas::geometry) AS lat, ST_X(coordenadas::geometry) AS lng
        FROM producer_profiles
        WHERE id = ${record.producerProfile.id}::uuid
      `;
      const coordinates = coordinatesRows[0];
      snapshot.producer = {
        farmName: record.producerProfile.farmName,
        municipality: record.producerProfile.municipality,
        village: record.producerProfile.village,
        latitude: coordinates?.lat ?? undefined,
        longitude: coordinates?.lng ?? undefined,
      };
    }

    snapshot.company = record.companyProfile
      ? {
          companyName: record.companyProfile.companyName,
          nit: record.companyProfile.nit,
          address: record.companyProfile.address ?? undefined,
          companyType: record.companyProfile.companyType ?? undefined,
          department: record.companyProfile.department ?? undefined,
          municipality: record.companyProfile.municipality ?? undefined,
        }
      : undefined;

    snapshot.transporter = record.transporterProfile
      ? {
          vehicleType: record.transporterProfile.vehicleType,
          plate: record.transporterProfile.plate,
          capacityKg: record.transporterProfile.capacityKg,
          coverageMunicipalities: record.transporterProfile.coverageMunicipalities,
          coldChain: record.transporterProfile.coldChain,
          soatExpiresAt: record.transporterProfile.soatExpiresAt,
          licenseExpiresAt: record.transporterProfile.licenseExpiresAt,
        }
      : undefined;

    return snapshot;
  }

  async updateProducerProfile(userId: string, data: ProducerProfileUpdate): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.producerProfile.update({
        where: { userId },
        data: {
          farmName: data.farmName,
          municipality: data.municipality,
          village: data.village,
        },
      });

      if (data.latitude !== undefined && data.longitude !== undefined) {
        await tx.$executeRaw`
          UPDATE producer_profiles
          SET coordenadas = ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)::geography
          WHERE user_id = ${userId}::uuid
        `;
      }
    });
  }

  async updateCompanyProfile(userId: string, data: CompanyProfileUpdate): Promise<void> {
    await this.prisma.companyProfile.update({
      where: { userId },
      data: {
        companyName: data.companyName,
        address: data.address,
        companyType: data.companyType,
        department: data.department,
        municipality: data.municipality,
      },
    });
  }

  async updateTransporterProfile(userId: string, data: TransporterProfileUpdate): Promise<void> {
    try {
      await this.prisma.transporterProfile.update({
        where: { userId },
        data: {
          vehicleType: data.vehicleType,
          plate: data.plate,
          capacityKg: data.capacityKg,
          coverageMunicipalities: data.coverageMunicipalities,
          coldChain: data.coldChain,
          soatExpiresAt: data.soatExpiresAt,
          licenseExpiresAt: data.licenseExpiresAt,
        },
      });
    } catch (error) {
      const target = uniqueViolationTarget(error);
      if (target?.includes('placa') || target?.includes('plate')) {
        throw new PlateAlreadyExistsError();
      }
      throw error;
    }
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

  /** Una carrera entre dos registros llega aquí como P2002: se traduce a 409, no a 500. */
  private mapRegisterError(error: unknown): Error {
    const target = uniqueViolationTarget(error);
    if (target === null) {
      return new InfrastructureError('No fue posible completar el registro', error);
    }
    if (target.includes('correo') || target.includes('email')) return new EmailAlreadyExistsError();
    if (target.includes('documento') || target.includes('document')) {
      return new DocumentAlreadyExistsError();
    }
    if (target.includes('celular') || target.includes('phone'))
      return new PhoneAlreadyExistsError();
    if (target.includes('nit')) return new NitAlreadyExistsError();
    if (target.includes('placa') || target.includes('plate')) {
      return new PlateAlreadyExistsError();
    }
    return new UserAlreadyExistsError();
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
