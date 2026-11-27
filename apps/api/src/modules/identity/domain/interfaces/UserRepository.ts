import type { User, UserStatus, PublicUserProfile } from '../entities/User';
import type { Role, RoleName } from '../entities/Role';
import type { CompanyType } from '../entities/CompanyProfile';
import type { VehicleType } from '../entities/TransporterProfile';
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

/**
 * Filtros del panel administrativo de usuarios.
 *
 * `roleName` y `status` ya vienen validados por la capa de aplicación; el
 * repositorio solo traduce a SQL. `search` busca en nombre, correo, documento
 * y celular sin distinguir mayúsculas.
 */
export interface AdminUserFilters {
  search?: string;
  roleName?: RoleName;
  status?: UserStatus;
  limit: number;
  offset: number;
}

export interface AdminUserPage {
  items: User[];
  total: number;
}

/** Presencia de perfiles sin cargar geometrías ni datos completos. */
export interface ProfilePresence {
  producer: boolean;
  company: boolean;
  transporter: boolean;
}

/** Datos mínimos de auditoría que se escriben en la misma transacción. */
export interface AuditEventData {
  actorId?: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  correlationId?: string;
}

export type AdminContinuityResult =
  { outcome: 'UPDATED'; user: User } | { outcome: 'NOT_FOUND' } | { outcome: 'LAST_ACTIVE_ADMIN' };

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

  /** Lista usuarios para el panel administrativo, con búsqueda y filtros. */
  findManyForAdmin(filters: AdminUserFilters): Promise<AdminUserPage>;
  /** Presencia de perfiles para validar cambios de rol sin cargar datos pesados. */
  findProfilePresenceById(userId: string): Promise<ProfilePresence | null>;
  /**
   * Cambia el estado y revoca refresh tokens en UNA transacción con lock
   * serializado. Relee el objetivo y revalida el invariante del último
   * administrador para que dos cambios concurrentes no dejen el sistema sin
   * administradores activos.
   */
  updateStatusPreservingAdminContinuity(
    userId: string,
    status: UserStatus,
    audit?: AuditEventData,
  ): Promise<AdminContinuityResult>;
  /**
   * Cambia el rol y revoca refresh tokens bajo el mismo lock de continuidad
   * administrativa. Si el rol no cambia, es idempotente y no revoca sesiones.
   */
  updateRolePreservingAdminContinuity(
    userId: string,
    roleId: string,
    roleName: RoleName,
    audit?: AuditEventData,
  ): Promise<AdminContinuityResult>;
}
