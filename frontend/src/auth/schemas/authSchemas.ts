/**
 * Esquemas de autenticación — reexportados desde el contrato compartido.
 *
 * Fuente única: @agroconnect/contracts (ADR-015, contract-first). Los esquemas
 * de formulario viven en el contrato para que web, móvil y futuros clientes
 * validen con las mismas reglas; los helpers de mapeo de errores a formulario
 * son específicos de UI y permanecen aquí.
 */
import type { z } from 'zod';

export {
  companySchema,
  credentialsSchema,
  farmSchema,
  forgotPasswordSchema,
  loginSchema,
  personalDataSchema,
  resetPasswordFormSchema as resetPasswordSchema,
  type CompanyForm,
  type CredentialsForm,
  type FarmForm,
  type ForgotPasswordForm,
  type LoginForm,
  type PersonalDataForm,
  type ResetPasswordForm,
} from '@agroconnect/contracts';

export interface FieldErrors {
  nombre?: string;
  documento?: string;
  correo?: string;
  celular?: string;
  password?: string;
  confirmarPassword?: string;
  aceptaTratamientoDatos?: string;
  form?: string;
  [field: string]: string | undefined;
}

export function zodErrorsToFields(error: z.ZodError): FieldErrors {
  const fields: FieldErrors = {};

  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!fields[key]) {
      fields[key] = issue.message;
    }
  }

  return fields;
}

export function serverDetailsToFields(details?: string[]): FieldErrors {
  const fields: FieldErrors = {};

  for (const detail of details ?? []) {
    const separator = detail.indexOf(': ');
    if (separator > 0) {
      const key = detail.slice(0, separator).trim();
      const message = detail.slice(separator + 2).trim();
      if (!fields[key]) {
        fields[key] = message;
      }
    }
  }

  return fields;
}
