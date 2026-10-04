import { randomUUID } from 'node:crypto';
import { Role, type RoleName } from '../../src/modules/auth/domain/entities/Role';
import { User } from '../../src/modules/auth/domain/entities/User';
import { RefreshToken } from '../../src/modules/auth/domain/entities/RefreshToken';
import type {
  NewCompanyProfileData,
  NewProducerProfileData,
  RegisterUserData,
  UserRepository,
} from '../../src/modules/auth/domain/interfaces/UserRepository';

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
  refreshTokens: RefreshToken[] = [];
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

  seedRefreshToken(userId: string, tokenHash: string, expiresAt: Date, revoked = false): void {
    this.refreshTokens.push(
      RefreshToken.create({
        id: randomUUID(),
        userId,
        tokenHash,
        expiresAt,
        revoked,
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

    this.seedRefreshToken(user.id, data.refreshToken.tokenHash, data.refreshToken.expiresAt);

    return user;
  }

  async saveRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<void> {
    this.seedRefreshToken(data.userId, data.tokenHash, data.expiresAt);
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

  async revokeAllUserTokens(userId: string): Promise<void> {
    this.refreshTokens = this.refreshTokens.map((token) =>
      token.userId === userId
        ? RefreshToken.create({ ...this.toProps(token), revoked: true })
        : token,
    );
  }

  async rotateRefreshToken(
    currentTokenHash: string,
    nextToken: { tokenHash: string; expiresAt: Date },
  ): Promise<void> {
    const current = this.refreshTokens.find((token) => token.tokenHash === currentTokenHash);
    if (!current) {
      return;
    }

    await this.revokeRefreshToken(currentTokenHash);
    this.seedRefreshToken(current.userId, nextToken.tokenHash, nextToken.expiresAt);
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
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

  private toProps(token: RefreshToken) {
    return {
      id: token.id,
      userId: token.userId,
      tokenHash: token.tokenHash,
      expiresAt: token.expiresAt,
      revoked: token.revoked,
      createdAt: token.createdAt,
    };
  }
}
