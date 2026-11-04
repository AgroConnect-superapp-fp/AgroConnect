import type { User } from '../entities/User';
import type { Role, RoleName } from '../entities/Role';
import type { CompanyType } from '../entities/CompanyProfile';
import type { VehicleType } from '../entities/TransporterProfile';
import type { RefreshToken } from '../entities/RefreshToken';
import type { PublicUserProfile } from '../entities/User';

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
  companyType?: CompanyType;
  department?: string;
  municipality?: string;
}

export interface NewTransporterProfileData {
  vehicleType: VehicleType;
  plate: string;
  capacityKg: number;
  coverageMunicipalities: string[];
  coldChain: boolean;
  soatExpiresAt: Date;
  licenseExpiresAt: Date;
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
  transporterProfile?: NewTransporterProfileData;
  refreshToken?: {
    tokenHash: string;
    expiresAt: Date;
    familyId: string;
    generation: number;
  };
}

export interface ProducerProfileSnapshot {
  farmName: string;
  municipality: string;
  village: string;
  latitude?: number;
  longitude?: number;
}

export interface CompanyProfileSnapshot {
  companyName: string;
  nit: string;
  address?: string;
  companyType?: CompanyType;
  department?: string;
  municipality?: string;
}

export interface TransporterProfileSnapshot {
  vehicleType: VehicleType;
  plate: string;
  capacityKg: number;
  coverageMunicipalities: string[];
  coldChain: boolean;
  soatExpiresAt: Date;
  licenseExpiresAt: Date;
}

export interface ProfileSnapshot {
  user: PublicUserProfile;
  producer?: ProducerProfileSnapshot;
  company?: CompanyProfileSnapshot;
  transporter?: TransporterProfileSnapshot;
}

export interface ProducerProfileUpdate {
  farmName?: string;
  municipality?: string;
  village?: string;
  latitude?: number;
  longitude?: number;
}

export interface CompanyProfileUpdate {
  companyName?: string;
  address?: string;
  companyType?: CompanyType;
  department?: string;
  municipality?: string;
}

export interface TransporterProfileUpdate {
  vehicleType?: VehicleType;
  plate?: string;
  capacityKg?: number;
  coverageMunicipalities?: string[];
  coldChain?: boolean;
  soatExpiresAt?: Date;
  licenseExpiresAt?: Date;
}

export interface UserRepository {
  findRoleByName(name: RoleName): Promise<Role | null>;
  findByEmail(email: string): Promise<User | null>;
  findByDocument(document: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  register(data: RegisterUserData): Promise<User>;
  saveRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    familyId: string;
    generation: number;
  }): Promise<void>;
  findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null>;
  revokeRefreshToken(tokenHash: string): Promise<void>;
  revokeRefreshTokenFamily(familyId: string): Promise<void>;
  revokeAllUserTokens(userId: string): Promise<void>;
  /** Revoca el token actual y emite el siguiente de forma atómica; `false` si ya estaba revocado. */
  rotateRefreshToken(
    currentTokenHash: string,
    nextToken: {
      tokenHash: string;
      expiresAt: Date;
      familyId: string;
      generation: number;
    },
  ): Promise<boolean>;
  findProfileById(id: string): Promise<ProfileSnapshot | null>;
  updateProducerProfile(userId: string, data: ProducerProfileUpdate): Promise<void>;
  updateCompanyProfile(userId: string, data: CompanyProfileUpdate): Promise<void>;
  updateTransporterProfile(userId: string, data: TransporterProfileUpdate): Promise<void>;
  updatePassword(userId: string, passwordHash: string): Promise<void>;
  markEmailVerified(userId: string): Promise<void>;
}
