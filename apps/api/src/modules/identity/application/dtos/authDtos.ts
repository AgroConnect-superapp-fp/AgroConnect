/**
 * DTOs de entrada de los casos de uso de identidad.
 *
 * Copia sin cambios del módulo legacy
 * (`backend/src/modules/auth/application/dtos/authDtos.ts`): los tipos de
 * entrada son parte del CONTRATO de la aplicación (los valida el esquema Zod
 * de `@agroconnect/contracts` en la capa de presentación).
 */
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
