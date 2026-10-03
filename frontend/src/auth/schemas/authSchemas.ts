import { z } from 'zod';

export const personalDataSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres')
    .max(120, 'El nombre no puede superar los 120 caracteres'),
  documento: z
    .string()
    .trim()
    .regex(
      /^\d{6,12}$/,
      'El documento debe contener solo dígitos entre 6 y 12 caracteres'
    ),
  correo: z.string().trim().toLowerCase().email('El correo no tiene un formato válido'),
  celular: z
    .string()
    .trim()
    .regex(/^3\d{9}$/, 'El celular debe tener 10 dígitos y comenzar por 3'),
});

export const farmSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'El nombre de la finca debe tener al menos 3 caracteres'),
  municipio: z.string().trim().min(3, 'El municipio debe tener al menos 3 caracteres'),
  vereda: z.string().trim().min(2, 'La vereda debe tener al menos 2 caracteres'),
});

export const companySchema = z.object({
  razonSocial: z
    .string()
    .trim()
    .min(3, 'La razón social debe tener al menos 3 caracteres'),
  nit: z
    .string()
    .trim()
    .regex(
      /^\d{9,10}(-\d)?$/,
      'El NIT debe tener 9 o 10 dígitos, con guion y dígito de verificación opcional'
    ),
  direccion: z.string().trim().max(200).optional(),
});

export const credentialsSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/, 'La contraseña debe incluir letras')
      .regex(/\d/, 'La contraseña debe incluir números'),
    confirmarPassword: z.string().min(1, 'Confirma tu contraseña'),
    aceptaTratamientoDatos: z.literal(true, {
      message: 'Debes autorizar el tratamiento de datos personales (Ley 1581 de 2012)',
    }),
  })
  .refine((data) => data.password === data.confirmarPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarPassword'],
  });

export const loginSchema = z.object({
  correo: z.string().trim().toLowerCase().email('El correo no tiene un formato válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const forgotPasswordSchema = z.object({
  correo: z.string().trim().toLowerCase().email('El correo no tiene un formato válido'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/, 'La contraseña debe incluir letras')
      .regex(/\d/, 'La contraseña debe incluir números'),
    confirmarPassword: z.string().min(1, 'Confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmarPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmarPassword'],
  });

export type PersonalDataForm = z.infer<typeof personalDataSchema>;
export type FarmForm = z.infer<typeof farmSchema>;
export type CompanyForm = z.infer<typeof companySchema>;
export type CredentialsForm = z.infer<typeof credentialsSchema>;
export type LoginForm = z.infer<typeof loginSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

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
