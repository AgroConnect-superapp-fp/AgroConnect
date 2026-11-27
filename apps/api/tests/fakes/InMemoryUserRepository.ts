import { randomUUID } from 'node:crypto';
import { Role, type RoleName } from '../../src/modules/identity/domain/entities/Role';
import {
  User,
  type UserProps,
  type UserStatus,
} from '../../src/modules/identity/domain/entities/User';
import { RefreshToken } from '../../src/modules/identity/domain/entities/RefreshToken';
import type {
  AdminContinuityResult,
  AdminUserFilters,
  AdminUserPage,
  CompanyProfileUpdate,
  ProfilePresence,
  ProfileSnapshot,
  ProducerProfileUpdate,
  TransporterProfileUpdate,
  NewCompanyProfileData,
  NewProducerProfileData,
  NewTransporterProfileData,
  RegisterUserData,
  UserRepository,
} from '../../src/modules/identity/domain/interfaces/UserRepository';

export const ROLE_CATALOG: Array<{ name: RoleName; description: string }> = [
  { name: 'productor', description: 'Productor agrícola' },
  { name: 'comprador_b2c', description: 'Comprador persona natural' },
  { name: 'comprador_b2b', description: 'Empresa compradora' },
  { name: 'transportista', description: 'Transportador' },
  { name: 'administrador', description: 'Administrador' },
];

export class InMemoryUserRepository implements UserRepository {
  users: User[] = [];
  producerProfiles = new Map<string, NewProducerProfileData>();
  companyProfiles = new Map<string, NewCompanyProfileData>();
  transporterProfiles = new Map<string, NewTransporterProfileData>();
  refreshTokens: RefreshToken[] = [];
  failUpdatePassword = false;
  private roleIds = new Map<RoleName, string>();

  constructor() {
    for (const role of ROLE_CATALOG) {
      this.roleIds.set(role.name, randomUUID());
    }
  }

  seedUser(
    overrides: Partial<{
      id: string;
      fullName: string;
      document: string;
      email: string;
      phone: string;
      passwordHash: string;
      roleName: RoleName;
      status: 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';
      emailVerifiedAt: Date | null;
    }> = {},
  ): User {
    const roleName = overrides.roleName ?? 'productor';
    const user = User.create({
      id: overrides.id ?? randomUUID(),
      fullName: overrides.fullName ?? 'Usuario de Prueba',
      document: overrides.document ?? '1234567890',
      email: overrides.email ?? 'usuario@example.com',
      phone: overrides.phone ?? '3001234567',
      passwordHash: overrides.passwordHash ?? 'hashed:Clave123',
      roleId: this.roleIds.get(roleName) as string,
      roleName,
      status: overrides.status ?? 'ACTIVO',
      acceptsDataProcessing: true,
      emailVerifiedAt: overrides.emailVerifiedAt ?? null,
      createdAt: new Date(),
    });
    this.users.push(user);
    return user;
  }

  seedRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    familyId: string = randomUUID(),
    generation = 0,
    revoked = false,
    rotatedAt: Date | null = null,
  ): void {
    this.refreshTokens.push(
      RefreshToken.create({
        id: randomUUID(),
        userId,
        tokenHash,
        familyId,
        generation,
        expiresAt,
        revoked,
        rotatedAt,
        createdAt: new Date(),
      }),
    );
  }

  async findRoleByName(name: RoleName): Promise<Role | null> {
    const role = ROLE_CATALOG.find((item) => item.name === name);
    if (!role) {
      return null;
    }

    return Role.create({
      id: this.roleIds.get(role.name) as string,
      name: role.name,
      description: role.description,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async findByDocument(document: string): Promise<User | null> {
    return this.users.find((user) => user.document === document) ?? null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.users.find((user) => user.phone === phone) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async register(data: RegisterUserData): Promise<User> {
    const user = User.create({
      id: data.user.id,
      fullName: data.user.fullName,
      document: data.user.document,
      email: data.user.email,
      phone: data.user.phone,
      passwordHash: data.user.passwordHash,
      roleId: data.user.roleId,
      roleName: data.user.roleName,
      status: 'ACTIVO',
      acceptsDataProcessing: data.user.acceptsDataProcessing,
      createdAt: new Date(),
    });

    this.users.push(user);

    if (data.producerProfile) {
      this.producerProfiles.set(user.id, data.producerProfile);
    }

    if (data.companyProfile) {
      this.companyProfiles.set(user.id, data.companyProfile);
    }

    if (data.transporterProfile) {
      this.transporterProfiles.set(user.id, data.transporterProfile);
    }

    if (data.refreshToken) {
      this.seedRefreshToken(
        user.id,
        data.refreshToken.tokenHash,
        data.refreshToken.expiresAt,
        data.refreshToken.familyId,
        data.refreshToken.generation,
      );
    }

    return user;
  }

  async saveRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    familyId: string;
    generation: number;
  }): Promise<void> {
    this.seedRefreshToken(
      data.userId,
      data.tokenHash,
      data.expiresAt,
      data.familyId,
      data.generation,
    );
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    return this.refreshTokens.find((token) => token.tokenHash === tokenHash) ?? null;
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    this.refreshTokens = this.refreshTokens.map((token) =>
      token.tokenHash === tokenHash
        ? RefreshToken.create({ ...this.toProps(token), revoked: true })
        : token,
    );
  }

  async revokeRefreshTokenFamily(familyId: string): Promise<void> {
    this.refreshTokens = this.refreshTokens.map((token) =>
      token.familyId === familyId
        ? RefreshToken.create({ ...this.toProps(token), revoked: true })
        : token,
    );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    this.refreshTokens = this.refreshTokens.map((token) =>
      token.userId === userId
        ? RefreshToken.create({ ...this.toProps(token), revoked: true })
        : token,
    );
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
    const current = this.refreshTokens.find((token) => token.tokenHash === currentTokenHash);
    if (!current) {
      return false;
    }

    if (current.revoked || current.isRotated()) {
      await this.revokeRefreshTokenFamily(current.familyId);
      return false;
    }

    if (current.isExpired()) {
      return false;
    }

    this.refreshTokens = this.refreshTokens.map((token) =>
      token.id === current.id
        ? RefreshToken.create({
            ...this.toProps(token),
            revoked: true,
            rotatedAt: new Date(),
          })
        : token,
    );
    this.seedRefreshToken(
      current.userId,
      nextToken.tokenHash,
      nextToken.expiresAt,
      nextToken.familyId,
      nextToken.generation,
    );
    return true;
  }

  async findProfileById(id: string): Promise<ProfileSnapshot | null> {
    const user = this.users.find((item) => item.id === id);
    if (!user) {
      return null;
    }

    const snapshot: ProfileSnapshot = { user: user.toPublicProfile() };
    const producer = this.producerProfiles.get(id);
    if (producer) {
      snapshot.producer = {
        farmName: producer.farmName,
        municipality: producer.municipality,
        village: producer.village,
        ...(producer.latitude !== undefined && producer.longitude !== undefined
          ? { latitude: producer.latitude, longitude: producer.longitude }
          : {}),
      };
    }

    const company = this.companyProfiles.get(id);
    if (company) {
      snapshot.company = {
        companyName: company.companyName,
        nit: company.nit,
        ...(company.address ? { address: company.address } : {}),
        ...(company.companyType ? { companyType: company.companyType } : {}),
        ...(company.department ? { department: company.department } : {}),
        ...(company.municipality ? { municipality: company.municipality } : {}),
      };
    }

    const transporter = this.transporterProfiles.get(id);
    if (transporter) {
      snapshot.transporter = {
        vehicleType: transporter.vehicleType,
        plate: transporter.plate,
        capacityKg: transporter.capacityKg,
        coverageMunicipalities: transporter.coverageMunicipalities,
        coldChain: transporter.coldChain,
        soatExpiresAt: transporter.soatExpiresAt,
        licenseExpiresAt: transporter.licenseExpiresAt,
      };
    }

    return snapshot;
  }

  async updateProducerProfile(userId: string, data: ProducerProfileUpdate): Promise<void> {
    const current = this.producerProfiles.get(userId);
    if (!current) throw new Error('perfil de productor no encontrado');
    this.producerProfiles.set(userId, { ...current, ...data });
  }

  async updateCompanyProfile(userId: string, data: CompanyProfileUpdate): Promise<void> {
    const current = this.companyProfiles.get(userId);
    if (!current) throw new Error('perfil de empresa no encontrado');
    this.companyProfiles.set(userId, { ...current, ...data });
  }

  async updateTransporterProfile(userId: string, data: TransporterProfileUpdate): Promise<void> {
    const current = this.transporterProfiles.get(userId);
    if (!current) throw new Error('perfil de transportista no encontrado');
    this.transporterProfiles.set(userId, { ...current, ...data });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    if (this.failUpdatePassword) {
      throw new Error('fallo simulado al actualizar el hash');
    }
    this.users = this.users.map((user) =>
      user.id === userId
        ? User.create({
            id: user.id,
            fullName: user.fullName,
            document: user.document,
            email: user.email,
            phone: user.phone,
            passwordHash,
            roleId: user.roleId,
            roleName: user.roleName,
            status: user.status,
            acceptsDataProcessing: user.acceptsDataProcessing,
            emailVerifiedAt: user.emailVerifiedAt,
            createdAt: user.createdAt,
          })
        : user,
    );
  }

  async findManyForAdmin(filters: AdminUserFilters): Promise<AdminUserPage> {
    const search = filters.search?.toLowerCase();

    const filtered = this.users.filter((user) => {
      if (filters.roleName && user.roleName !== filters.roleName) {
        return false;
      }
      if (filters.status && user.status !== filters.status) {
        return false;
      }
      if (!search) {
        return true;
      }
      return [user.fullName, user.email, user.document, user.phone].some((value) =>
        value.toLowerCase().includes(search),
      );
    });

    const sorted = [...filtered].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id),
    );

    return {
      items: sorted.slice(filters.offset, filters.offset + filters.limit),
      total: filtered.length,
    };
  }

  async findProfilePresenceById(userId: string): Promise<ProfilePresence | null> {
    if (!this.users.some((user) => user.id === userId)) {
      return null;
    }

    return {
      producer: this.producerProfiles.has(userId),
      company: this.companyProfiles.has(userId),
      transporter: this.transporterProfiles.has(userId),
    };
  }

  async updateStatusPreservingAdminContinuity(
    userId: string,
    status: UserStatus,
    _audit?: import('../../src/modules/identity/domain/interfaces/UserRepository').AuditEventData,
  ): Promise<AdminContinuityResult> {
    const target = this.users.find((user) => user.id === userId);
    if (!target) {
      return { outcome: 'NOT_FOUND' };
    }

    const isActiveAdmin = target.roleName === 'administrador' && target.status === 'ACTIVO';
    if (isActiveAdmin && status !== 'ACTIVO' && this.countActiveAdministrators() <= 1) {
      return { outcome: 'LAST_ACTIVE_ADMIN' };
    }

    if (target.status === status) {
      return { outcome: 'UPDATED', user: target };
    }

    const updated = this.replaceUser(userId, { status });
    if (status !== 'ACTIVO') {
      await this.revokeAllUserTokens(userId);
    }
    return { outcome: 'UPDATED', user: updated };
  }

  async updateRolePreservingAdminContinuity(
    userId: string,
    roleId: string,
    roleName: RoleName,
    _audit?: import('../../src/modules/identity/domain/interfaces/UserRepository').AuditEventData,
  ): Promise<AdminContinuityResult> {
    const target = this.users.find((user) => user.id === userId);
    if (!target) {
      return { outcome: 'NOT_FOUND' };
    }

    if (target.roleId === roleId) {
      return { outcome: 'UPDATED', user: target };
    }

    const isActiveAdmin = target.roleName === 'administrador' && target.status === 'ACTIVO';
    if (isActiveAdmin && roleName !== 'administrador' && this.countActiveAdministrators() <= 1) {
      return { outcome: 'LAST_ACTIVE_ADMIN' };
    }

    const updated = this.replaceUser(userId, {
      roleId,
      roleName: this.findRoleNameById(roleId),
    });

    await this.revokeAllUserTokens(userId);
    return { outcome: 'UPDATED', user: updated };
  }

  private countActiveAdministrators(): number {
    return this.users.filter(
      (user) => user.roleName === 'administrador' && user.status === 'ACTIVO',
    ).length;
  }

  async markEmailVerified(userId: string): Promise<void> {
    this.users = this.users.map((user) =>
      user.id === userId
        ? User.create({
            id: user.id,
            fullName: user.fullName,
            document: user.document,
            email: user.email,
            phone: user.phone,
            passwordHash: user.passwordHash,
            roleId: user.roleId,
            roleName: user.roleName,
            status: user.status,
            acceptsDataProcessing: user.acceptsDataProcessing,
            emailVerifiedAt: new Date(),
            createdAt: user.createdAt,
          })
        : user,
    );
  }

  private replaceUser(
    userId: string,
    overrides: Partial<Pick<UserProps, 'status' | 'roleId' | 'roleName'>>,
  ): User {
    const index = this.users.findIndex((user) => user.id === userId);
    const current = this.users[index] ?? undefined;
    if (!current) {
      throw new Error('usuario no encontrado');
    }

    const updated = User.create({
      id: current.id,
      fullName: current.fullName,
      document: current.document,
      email: current.email,
      phone: current.phone,
      passwordHash: current.passwordHash,
      roleId: current.roleId,
      roleName: current.roleName,
      status: current.status,
      acceptsDataProcessing: current.acceptsDataProcessing,
      emailVerifiedAt: current.emailVerifiedAt,
      createdAt: current.createdAt,
      ...overrides,
    });

    this.users[index] = updated;
    return updated;
  }

  private findRoleNameById(roleId: string): RoleName {
    for (const [name, id] of this.roleIds) {
      if (id === roleId) {
        return name;
      }
    }
    throw new Error('rol no encontrado');
  }

  private toProps(token: RefreshToken) {
    return {
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      familyId: token.familyId,
      generation: token.generation,
      expiresAt: token.expiresAt,
      revoked: token.revoked,
      rotatedAt: token.rotatedAt,
      createdAt: token.createdAt,
    };
  }
}
