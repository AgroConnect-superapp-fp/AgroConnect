/**
 * Contratos de autenticación de AgroConnect — ÚNICA fuente de verdad (ADR-015).
 *
 * Este paquete concentra:
 *  1. Los esquemas del contrato API (request bodies que el backend valida en servidor).
 *  2. Los esquemas de formulario (validación de UX en el cliente, derivados del contrato).
 *  3. Los tipos inferidos (`z.infer`) para consumidores TypeScript.
 *
 * Regla de convivencia API ↔ formularios:
 *  - El contrato API usa la regla del backend (es quien valida en servidor).
 *  - Los formularios pueden ser MÁS estrictos que el API (p. ej. exigir letras y
 *    números en la contraseña, confirmación de contraseña): un subconjunto válido
 *    nunca produce rechazos del servidor. Lo que el formulario NO puede es ser
 *    más laxo que el contrato.
 */
import { z } from 'zod';

/* ────────────────────────────────────────────────────────────────────────────
 * Roles auto-registrables (contrato del endpoint POST /api/v1/auth/register)
 *
 * NOTA DE SINCRONÍA: el dominio del backend define la misma lista en
 * `backend/src/modules/auth/domain/entities/Role.ts`. El dominio NO depende de
 * este paquete (Clean Architecture: dominio sin dependencias externas); la
 * sincronía entre ambas listas la garantiza el test
 * `backend/tests/unit/shared/contractsSynchronization.test.ts`.
 * ──────────────────────────────────────────────────────────────────────────── */
export const SELF_REGISTRABLE_ROLE_NAMES = [
  'productor',
  'comprador_b2c',
  'comprador_b2b',
  'transportista',
] as const;

/* ────────────────────────────────────────────────────────────────────────────
 * 1. Contrato API — request bodies validados por el backend
 * ──────────────────────────────────────────────────────────────────────────── */

const roleSchema = z.enum(SELF_REGISTRABLE_ROLE_NAMES);

const producerProfileSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'El nombre de la finca debe tener al menos 3 caracteres')
    .max(120),
  municipio: z.string().trim().min(3, 'El municipio debe tener al menos 3 caracteres').max(120),
  vereda: z.string().trim().min(2, 'La vereda debe tener al menos 2 caracteres').max(120),
  latitud: z.number().min(-90).max(90).optional(),
  longitud: z.number().min(-180).max(180).optional(),
});

const companyProfileSchema = z.object({
  razonSocial: z
    .string()
    .trim()
    .min(3, 'La razón social debe tener al menos 3 caracteres')
    .max(160),
  nit: z
    .string()
    .trim()
    .regex(
      /^\d{9,10}(-\d)?$/,
      'El NIT debe tener 9 o 10 dígitos, con guion y dígito de verificación opcional',
    ),
  direccion: z.string().trim().max(200).optional(),
});

export const registerSchema = z.object({
  nombre: z
    .string({ error: 'El nombre completo es obligatorio' })
    .trim()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres')
    .max(120, 'El nombre completo no puede superar los 120 caracteres'),
  documento: z
    .string({ error: 'El documento es obligatorio' })
    .trim()
    .regex(/^\d{6,12}$/, 'El documento debe contener solo dígitos entre 6 y 12 caracteres'),
  correo: z
    .string({ error: 'El correo es obligatorio' })
    .trim()
    .toLowerCase()
    .email('El correo no tiene un formato válido')
    .max(254, 'El correo no puede superar los 254 caracteres'),
  celular: z
    .string({ error: 'El celular es obligatorio' })
    .trim()
    .regex(/^3\d{9}$/, 'El celular debe tener 10 dígitos y comenzar por 3 (formato Colombia)'),
  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede superar los 72 caracteres'),
  rol: roleSchema,
  finca: producerProfileSchema.optional(),
  empresa: companyProfileSchema.optional(),
  aceptaTratamientoDatos: z
    .boolean({ error: 'La autorización de tratamiento de datos es obligatoria' })
    .refine((value) => value === true, {
      message: 'Debe autorizar el tratamiento de datos personales (Ley 1581 de 2012)',
    }),
});

export const loginSchema = z.object({
  correo: z
    .string({ error: 'El correo es obligatorio' })
    .trim()
    .toLowerCase()
    .email('El correo no tiene un formato válido'),
  password: z
    .string({ error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria'),
});

export const refreshSchema = z.object({
  refreshToken: z
    .string({ error: 'El refresh token es obligatorio' })
    .min(1, 'El refresh token es obligatorio'),
});

export const logoutSchema = refreshSchema;

export const forgotPasswordSchema = z.object({
  correo: z
    .string({ error: 'El correo es obligatorio' })
    .trim()
    .toLowerCase()
    .email('El correo no tiene un formato válido'),
});

export const resetPasswordSchema = z.object({
  token: z
    .string({ error: 'El token de recuperación es obligatorio' })
    .trim()
    .min(1, 'El token de recuperación es obligatorio'),
  password: z
    .string({ error: 'La nueva contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede superar los 72 caracteres'),
});

export const verifyEmailSchema = z.object({
  token: z
    .string({ error: 'El token de verificación es obligatorio' })
    .trim()
    .min(1, 'El token de verificación es obligatorio'),
});

export const resendVerificationSchema = forgotPasswordSchema;

/* ────────────────────────────────────────────────────────────────────────────
 * 2. Esquemas de formulario — validación de UX en el cliente
 *
 *    Diferencias intencionales frente al contrato API (documentadas en el
 *    reporte de la Fase 2.2): la contraseña del formulario exige letras y
 *    números (regex de UX) y los formularios de contraseña piden
 *    confirmación. El API no exige ninguna de las dos cosas.
 * ──────────────────────────────────────────────────────────────────────────── */

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

export const resetPasswordFormSchema = z
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

/* ────────────────────────────────────────────────────────────────────────────
 * 3. Tipos inferidos
 * ──────────────────────────────────────────────────────────────────────────── */

/* Contrato API */
export type RegisterRequestBody = z.infer<typeof registerSchema>;
export type LoginRequestBody = z.infer<typeof loginSchema>;
export type RefreshRequestBody = z.infer<typeof refreshSchema>;
export type LogoutRequestBody = z.infer<typeof logoutSchema>;
export type ForgotPasswordRequestBody = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequestBody = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailRequestBody = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationRequestBody = z.infer<typeof resendVerificationSchema>;

/* Formularios */
export type PersonalDataForm = z.infer<typeof personalDataSchema>;
export type FarmForm = z.infer<typeof farmSchema>;
export type CompanyForm = z.infer<typeof companySchema>;
export type CredentialsForm = z.infer<typeof credentialsSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordFormSchema>;
export type LoginForm = z.infer<typeof loginSchema>;
export type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
