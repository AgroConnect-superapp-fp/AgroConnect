import { InvalidDataError } from '../errors/AuthErrors';
import type { RoleName } from './Role';

export type UserStatus = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO';

export interface UserProps {
  id: string;
  fullName: string;
  document: string;
  email: string;
  phone: string;
  passwordHash: string;
  roleId: string;
  roleName: RoleName;
  status: UserStatus;
  acceptsDataProcessing: boolean;
  emailVerifiedAt?: Date | null;
  createdAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  static create(props: UserProps): User {
    if (props.fullName.trim().length < 3) {
      throw new InvalidDataError('El nombre completo debe tener al menos 3 caracteres');
    }

    if (!props.acceptsDataProcessing) {
      throw new InvalidDataError(
        'Debe autorizar el tratamiento de datos personales (Ley 1581 de 2012)',
      );
    }

    return new User(props);
  }

  get id(): string {
    return this.props.id;
  }

  get fullName(): string {
    return this.props.fullName;
  }

  get document(): string {
    return this.props.document;
  }

  get email(): string {
    return this.props.email;
  }

  get phone(): string {
    return this.props.phone;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get roleId(): string {
    return this.props.roleId;
  }

  get roleName(): RoleName {
    return this.props.roleName;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get acceptsDataProcessing(): boolean {
    return this.props.acceptsDataProcessing;
  }

  get emailVerifiedAt(): Date | null {
    return this.props.emailVerifiedAt ?? null;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isActive(): boolean {
    return this.props.status === 'ACTIVO';
  }

  isEmailVerified(): boolean {
    return this.emailVerifiedAt !== null;
  }

  toPublicProfile(): PublicUserProfile {
    return {
      id: this.props.id,
      nombre: this.props.fullName,
      correo: this.props.email,
      rol: this.props.roleName,
      estado: this.props.status,
      verificado: this.isEmailVerified(),
      fechaRegistro: this.props.createdAt.toISOString(),
    };
  }
}

export interface PublicUserProfile {
  id: string;
  nombre: string;
  correo: string;
  rol: RoleName;
  estado: UserStatus;
  verificado: boolean;
  fechaRegistro: string;
}
