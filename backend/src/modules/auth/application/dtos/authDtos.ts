import type { RoleName } from '../../domain/entities/Role';

export interface RegisterUserInput {
  nombre: string;
  documento: string;
  correo: string;
  celular: string;
  password: string;
  rol: RoleName;
  finca?: {
    nombre: string;
    municipio: string;
    vereda: string;
    latitud?: number;
    longitud?: number;
  };
  empresa?: {
    razonSocial: string;
    nit: string;
    direccion?: string;
  };
  aceptaTratamientoDatos: boolean;
}

export interface LoginInput {
  correo: string;
  password: string;
}

export interface RefreshInput {
  refreshToken: string;
}

export interface LogoutInput {
  refreshToken: string;
}

export interface ForgotPasswordInput {
  correo: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface VerifyEmailInput {
  token: string;
}

export interface ResendVerificationInput {
  correo: string;
}
