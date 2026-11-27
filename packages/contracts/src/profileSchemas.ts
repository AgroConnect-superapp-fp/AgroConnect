/**
 * Contratos del perfil autenticado (`GET/PATCH /api/v1/profile/me`).
 *
 * Cada rol solo puede actualizar su propio bloque; el servidor valida además
 * que el bloque enviado coincida con el rol de la sesión.
 */
import { z } from "zod";
import { COMPANY_TYPES, VEHICLE_TYPES } from "./authSchemas";

const isoDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener formato AAAA-MM-DD");

const producerUpdateSchema = z
  .object({
    nombre: z.string().trim().min(3).max(120).optional(),
    municipio: z.string().trim().min(3).max(120).optional(),
    vereda: z.string().trim().min(2).max(120).optional(),
    latitud: z.number().min(-90).max(90).optional(),
    longitud: z.number().min(-180).max(180).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "Envía al menos un campo del perfil de productor",
  });

const companyUpdateSchema = z
  .object({
    razonSocial: z.string().trim().min(3).max(160).optional(),
    direccion: z.string().trim().max(200).optional(),
    tipoEmpresa: z.enum(COMPANY_TYPES).optional(),
    departamento: z.string().trim().min(2).max(120).optional(),
    municipio: z.string().trim().min(2).max(120).optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "Envía al menos un campo del perfil de empresa",
  });

const transporterUpdateSchema = z
  .object({
    tipoVehiculo: z.enum(VEHICLE_TYPES).optional(),
    placa: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        /^[A-Z]{3}\d{3}$|^[A-Z]{3}\d{2}[A-Z]$/,
        "La placa debe tener el formato ABC123 o ABC12D",
      )
      .optional(),
    capacidadKg: z.number().positive().max(100_000).optional(),
    cobertura: z
      .array(z.string().trim().min(3).max(120))
      .min(1)
      .max(20)
      .optional(),
    cadenaFrio: z.boolean().optional(),
    soatVence: isoDateSchema.optional(),
    licenciaVence: isoDateSchema.optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "Envía al menos un campo del perfil de transportista",
  });

export const profileUpdateSchema = z
  .object({
    productor: producerUpdateSchema.optional(),
    empresa: companyUpdateSchema.optional(),
    transportista: transporterUpdateSchema.optional(),
  })
  .refine((value) => Object.values(value).some((item) => item !== undefined), {
    message: "Debes enviar al menos un perfil para actualizar",
  })
  .refine(
    (value) =>
      [value.productor, value.empresa, value.transportista].filter(Boolean)
        .length === 1,
    "Solo puedes actualizar el perfil correspondiente a tu rol",
  );

export const publicUserProfileSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  correo: z.string(),
  rol: z.enum([
    "productor",
    "comprador_b2c",
    "comprador_b2b",
    "transportista",
    "administrador",
  ]),
  estado: z.enum(["ACTIVO", "INACTIVO", "SUSPENDIDO"]),
  verificado: z.boolean(),
  fechaRegistro: z.string(),
});

export const producerProfileResponseSchema = z.object({
  nombre: z.string(),
  municipio: z.string(),
  vereda: z.string(),
  latitud: z.number().optional(),
  longitud: z.number().optional(),
});

export const companyProfileResponseSchema = z.object({
  razonSocial: z.string(),
  nit: z.string(),
  direccion: z.string().optional(),
  tipoEmpresa: z.enum(COMPANY_TYPES).optional(),
  departamento: z.string().optional(),
  municipio: z.string().optional(),
});

export const transporterProfileResponseSchema = z.object({
  tipoVehiculo: z.enum(VEHICLE_TYPES),
  placa: z.string(),
  capacidadKg: z.number(),
  cobertura: z.array(z.string()),
  cadenaFrio: z.boolean(),
  soatVence: z.string(),
  licenciaVence: z.string(),
});

export const profileSnapshotSchema = z.object({
  usuario: publicUserProfileSchema,
  productor: producerProfileResponseSchema.optional(),
  empresa: companyProfileResponseSchema.optional(),
  transportista: transporterProfileResponseSchema.optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProfileSnapshot = z.infer<typeof profileSnapshotSchema>;
