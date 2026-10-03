import { z } from 'zod';
import { ROLE_NAMES } from '../../domain/entities/Role';

const roleSchema = z.enum(ROLE_NAMES);

const producerProfileSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre de la finca debe tener al menos 3 caracteres').max(120),
  municipio: z.string().trim().min(3, 'El municipio debe tener al menos 3 caracteres').max(120),
  vereda: z.string().trim().min(2, 'La vereda debe tener al menos 2 caracteres').max(120),
  latitud: z.number().min(-90).max(90).optional(),
  longitud: z.number().min(-180).max(180).optional(),
});

const companyProfileSchema = z.object({
  razonSocial: z.string().trim().min(3, 'La razón social debe tener al menos 3 caracteres').max(160),
  nit: z
    .string()
    .trim()
    .regex(/^\d{9,10}(-\d)?$/, 'El NIT debe tener 9 o 10 dígitos, con guion y dígito de verificación opcional'),
  direccion: z.string().trim().max(200).optional(),
});

export const registerSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre completo es obligatorio' })
    .trim()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres')
    .max(120, 'El nombre completo no puede superar los 120 caracteres'),
  documento: z
    .string({ required_error: 'El documento es obligatorio' })
    .trim()
    .regex(/^\d{6,12}$/, 'El documento debe contener solo dígitos entre 6 y 12 caracteres'),
  correo: z
    .string({ required_error: 'El correo es obligatorio' })
    .trim()
    .toLowerCase()
    .email('El correo no tiene un formato válido')
    .max(254, 'El correo no puede superar los 254 caracteres'),
  celular: z
    .string({ required_error: 'El celular es obligatorio' })
    .trim()
    .regex(/^3\d{9}$/, 'El celular debe tener 10 dígitos y comenzar por 3 (formato Colombia)'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede superar los 72 caracteres'),
  rol: roleSchema,
  finca: producerProfileSchema.optional(),
  empresa: companyProfileSchema.optional(),
  aceptaTratamientoDatos: z
    .boolean({ required_error: 'La autorización de tratamiento de datos es obligatoria' })
    .refine((value) => value === true, {
      message: 'Debe autorizar el tratamiento de datos personales (Ley 1581 de 2012)',
    }),
});

export const loginSchema = z.object({
  correo: z
    .string({ required_error: 'El correo es obligatorio' })
    .trim()
    .toLowerCase()
    .email('El correo no tiene un formato válido'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria'),
});

export const refreshSchema = z.object({
  refreshToken: z
    .string({ required_error: 'El refresh token es obligatorio' })
    .min(1, 'El refresh token es obligatorio'),
});

export const logoutSchema = refreshSchema;

export const forgotPasswordSchema = z.object({
  correo: z
    .string({ required_error: 'El correo es obligatorio' })
    .trim()
    .toLowerCase()
    .email('El correo no tiene un formato válido'),
});

export const resetPasswordSchema = z.object({
  token: z
    .string({ required_error: 'El token de recuperación es obligatorio' })
    .trim()
    .min(1, 'El token de recuperación es obligatorio'),
  password: z
    .string({ required_error: 'La nueva contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede superar los 72 caracteres'),
});

export const verifyEmailSchema = z.object({
  token: z
    .string({ required_error: 'El token de verificación es obligatorio' })
    .trim()
    .min(1, 'El token de verificación es obligatorio'),
});

export const resendVerificationSchema = forgotPasswordSchema;

export type RegisterRequestBody = z.infer<typeof registerSchema>;
export type LoginRequestBody = z.infer<typeof loginSchema>;
export type RefreshRequestBody = z.infer<typeof refreshSchema>;
export type LogoutRequestBody = z.infer<typeof logoutSchema>;
export type ForgotPasswordRequestBody = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequestBody = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailRequestBody = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationRequestBody = z.infer<typeof resendVerificationSchema>;
