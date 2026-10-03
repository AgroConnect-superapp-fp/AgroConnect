import type { User } from '../entities/User';
import type { Role, RoleName } from '../entities/Role';
import type { RefreshToken } from '../entities/RefreshToken';

export interface NewProducerProfileData {
  farmName: string;
  municipality: string;
  village: string;
  latitude?: number;
  longitude?: number;
}

export interface NewCompanyProfileData {
  companyName: string;
  nit: string;
  address?: string;
}

export interface NewUserData {
  id: string;
  fullName: string;
  document: string;
  email: string;
  phone: string;
  passwordHash: string;
  roleId: string;
  roleName: RoleName;
  acceptsDataProcessing: boolean;
}

export interface RegisterUserData {
  user: NewUserData;
  producerProfile?: NewProducerProfileData;
  companyProfile?: NewCompanyProfileData;
  refreshToken: {
    tokenHash: string;
    expiresAt: Date;
  };
}

export interface UserRepository {
  findRoleByName(name: RoleName): Promise<Role | null>;
  findByEmail(email: string): Promise<User | null>;
  findByDocument(document: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  register(data: RegisterUserData): Promise<User>;
  saveRefreshToken(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null>;
  revokeRefreshToken(tokenHash: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;
  rotateRefreshToken(
    currentTokenHash: string,
    nextToken: { tokenHash: string; expiresAt: Date },
  ): Promise<void>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
  markEmailVerified(userId: string): Promise<void>;
}
