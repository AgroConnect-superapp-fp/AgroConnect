/**
 * Contratos del marketplace (M03) — ÚNICA fuente de verdad (ADR-015).
 *
 * `GET /api/v1/products` reemplaza la lectura directa a Supabase/PostgREST.
 * El contrato de respuesta refleja el `Property` que ya consume el frontend:
 * la migración no cambia la UI, solo el origen de los datos.
 */
import { z } from "zod";

export const MARKETPLACE_CROPS = [
  "coffee",
  "cacao",
  "banana",
  "sugarcane",
  "rice",
  "corn",
  "cassava",
  "oil_palm",
] as const;

export const PRODUCT_MODERATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;

export const MARKETPLACE_CERTIFICATIONS = [
  "organic",
  "rainforest_alliance",
  "fair_trade",
  "conventional",
  "global_gap",
] as const;

export const productImageSchema = z.object({
  publicId: z.string().min(1).max(255),
  url: z.string().max(2048).optional(),
  alt: z.string().max(200).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  bytes: z.number().nonnegative().optional(),
  uploadedAt: z.string().max(40).optional(),
  moderationStatus: z.enum(["pending", "approved", "rejected"]).optional(),
  lqip: z.string().max(8192).optional(),
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
  productivity: z.number().int().min(0).max(100),
  certification: z.enum(MARKETPLACE_CERTIFICATIONS).optional(),
  moderationStatus: z.enum(PRODUCT_MODERATION_STATUSES),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  producerId: z.string().optional(),
  images: z.array(productImageSchema),
  coordinates: z.array(z.tuple([z.number(), z.number()])),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

/**
 * Query de `GET /api/v1/products`.
 *
 * `limit` y `offset` llegan como strings; Zod los coacciona en el servidor.
 * `search` se limita a 80 caracteres para que la consulta no crezca sin
 * control; el caso de uso elimina los wildcards de SQL antes de usarla.
 */
export const productsQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(80, "La búsqueda no puede superar 80 caracteres")
    .optional(),
  crop: z.enum(MARKETPLACE_CROPS).optional(),
  department: z.string().trim().max(120).optional(),
  municipality: z.string().trim().max(120).optional(),
  certification: z.enum(MARKETPLACE_CERTIFICATIONS).optional(),
  limit: z.coerce
    .number({ error: "El límite debe ser numérico" })
    .int("El límite debe ser un entero")
    .min(1, "El límite debe estar entre 1 y 100")
    .max(100, "El límite debe estar entre 1 y 100")
    .default(50),
  offset: z.coerce
    .number({ error: "El offset debe ser numérico" })
    .int("El offset debe ser un entero")
    .min(0, "El offset no puede ser negativo")
    .default(0),
});

export type Product = z.infer<typeof productSchema>;
export type ProductImage = z.infer<typeof productImageSchema>;
export type ProductsQuery = z.infer<typeof productsQuerySchema>;

/**
 * Query de `GET /api/v1/products/pending`.
 *
 * La moderación usa una página por defecto más pequeña que el catálogo
 * público; el panel puede pedir hasta 100 elementos por página.
 */
export const pendingProductsQuerySchema = z.object({
  limit: z.coerce
    .number({ error: "El límite debe ser numérico" })
    .int("El límite debe ser un entero")
    .min(1, "El límite debe estar entre 1 y 100")
    .max(100, "El límite debe estar entre 1 y 100")
    .default(20),
  offset: z.coerce
    .number({ error: "El offset debe ser numérico" })
    .int("El offset debe ser un entero")
    .min(0, "El offset no puede ser negativo")
    .default(0),
});

export type PendingProductsQuery = z.infer<typeof pendingProductsQuerySchema>;

/**
 * Cuerpo de `POST /api/v1/products`.
 *
 * El `producerId` NO viaja en el cuerpo: lo toma el servidor de la sesión
 * autenticada. `owner` es opcional y, si falta, se usa el nombre del productor.
 */
export const publishProductSchema = z.object({
  name: z
    .string({ error: "El nombre del producto es obligatorio" })
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(160, "El nombre no puede superar 160 caracteres"),
  owner: z.string().trim().min(3).max(160).optional(),
  description: z.string().trim().max(2000).optional(),
  contact: z.string().trim().max(60).optional(),
  department: z
    .string({ error: "El departamento es obligatorio" })
    .trim()
    .min(2, "El departamento debe tener al menos 2 caracteres")
    .max(120),
  municipality: z
    .string({ error: "El municipio es obligatorio" })
    .trim()
    .min(2, "El municipio debe tener al menos 2 caracteres")
    .max(120),
  crop: z.enum(MARKETPLACE_CROPS),
  area: z
    .number({ error: "El área es obligatoria" })
    .positive("El área debe ser mayor que cero")
    .max(100_000, "El área no puede superar 100000 hectáreas"),
  productivity: z
    .number({ error: "La productividad es obligatoria" })
    .int("La productividad debe ser un entero")
    .min(0, "La productividad debe estar entre 0 y 100")
    .max(100, "La productividad debe estar entre 0 y 100"),
  certification: z.enum(MARKETPLACE_CERTIFICATIONS).optional(),
  lat: z
    .number({ error: "La latitud es obligatoria" })
    .min(-90, "La latitud debe estar entre -90 y 90")
    .max(90, "La latitud debe estar entre -90 y 90"),
  lng: z
    .number({ error: "La longitud es obligatoria" })
    .min(-180, "La longitud debe estar entre -180 y 180")
    .max(180, "La longitud debe estar entre -180 y 180"),
  images: z
    .array(productImageSchema)
    .max(6, "Máximo 6 imágenes por producto")
    .default([]),
  coordinates: z
    .array(z.tuple([z.number(), z.number()]))
    .max(100, "La parcela no puede tener más de 100 puntos")
    .default([]),
});

export type PublishProductInput = z.infer<typeof publishProductSchema>;

/**
 * Cuerpo de `PATCH /api/v1/products/:id`.
 *
 * Por ahora solo se editan las imágenes. Cualquier cambio de un productor
 * devuelve el producto a `pending` para una nueva revisión.
 */
export const updateProductImagesSchema = z.object({
  images: z.array(productImageSchema).max(6, "Máximo 6 imágenes por producto"),
});

export type UpdateProductImagesInput = z.infer<
  typeof updateProductImagesSchema
>;

/** Cuerpo de `PATCH /api/v1/products/:id/moderation` (solo administrador). */
export const updateProductModerationSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

export type UpdateProductModerationInput = z.infer<
  typeof updateProductModerationSchema
>;
