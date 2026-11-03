/**
 * Contratos del marketplace (M03) — ÚNICA fuente de verdad (ADR-015).
 *
 * `GET /api/v1/products` reemplaza la lectura directa a Supabase/PostgREST.
 * El contrato de respuesta refleja el `Property` que ya consume el frontend:
 * la migración no cambia la UI, solo el origen de los datos.
 */
import { z } from 'zod';

export const MARKETPLACE_CROPS = [
  'coffee',
  'cacao',
  'banana',
  'sugarcane',
  'rice',
  'corn',
  'cassava',
  'oil_palm',
] as const;

export const MARKETPLACE_CERTIFICATIONS = [
  'organic',
  'rainforest_alliance',
  'fair_trade',
  'conventional',
  'global_gap',
] as const;

export const productImageSchema = z.object({
  publicId: z.string().min(1),
  url: z.string().optional(),
  alt: z.string().optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  bytes: z.number().nonnegative().optional(),
  uploadedAt: z.string().optional(),
  moderationStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  lqip: z.string().optional(),
});

export const productSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  owner: z.string().min(1),
  description: z.string().optional(),
  contact: z.string().optional(),
  department: z.string().min(1),
  municipality: z.string().min(1),
  crop: z.enum(MARKETPLACE_CROPS),
  area: z.number().positive(),
  productivity: z.number().min(0).max(100),
  certification: z.enum(MARKETPLACE_CERTIFICATIONS).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  images: z.array(productImageSchema),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
});

/**
 * Query de `GET /api/v1/products`.
 *
 * `limit` y `offset` llegan como strings; Zod los coacciona en el servidor.
 * `search` se limita a 80 caracteres para que la consulta no crezca sin
 * control; el caso de uso elimina los wildcards de SQL antes de usarla.
 */
export const productsQuerySchema = z.object({
  search: z.string().trim().max(80, 'La búsqueda no puede superar 80 caracteres').optional(),
  crop: z.enum(MARKETPLACE_CROPS).optional(),
  department: z.string().trim().max(120).optional(),
  municipality: z.string().trim().max(120).optional(),
  certification: z.enum(MARKETPLACE_CERTIFICATIONS).optional(),
  limit: z.coerce
    .number({ error: 'El límite debe ser numérico' })
    .int('El límite debe ser un entero')
    .min(1, 'El límite debe estar entre 1 y 100')
    .max(100, 'El límite debe estar entre 1 y 100')
    .default(50),
  offset: z.coerce
    .number({ error: 'El offset debe ser numérico' })
    .int('El offset debe ser un entero')
    .min(0, 'El offset no puede ser negativo')
    .default(0),
});

export type Product = z.infer<typeof productSchema>;
export type ProductImage = z.infer<typeof productImageSchema>;
export type ProductsQuery = z.infer<typeof productsQuerySchema>;
