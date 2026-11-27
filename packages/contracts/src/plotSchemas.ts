/**
 * Contratos del módulo geography (parcelas) — ÚNICA fuente de verdad (ADR-015).
 *
 * Los parámetros llegan como query string (strings en Express), así que el
 * contrato usa `z.coerce.number()`: la coerción ocurre en el servidor y el
 * tipo inferido ya es numérico para todos los consumidores TypeScript.
 *
 * La geometría de la parcela es un polígono GeoJSON simple: un único anillo
 * exterior de vértices `[longitud, latitud]` (orden GeoJSON: primero longitud).
 * El servidor NO calcula áreas ni distancias en JavaScript (SPEC §12): solo
 * valida la forma y la pertenencia al territorio colombiano; el centroide y el
 * área los calcula PostGIS en la base de datos.
 */
import { z } from "zod";

/* ────────────────────────────────────────────────────────────────────────────
 * Contrato API — GET /api/v1/plots/nearby
 *
 * Rangos alineados con la validación del caso de uso del backend
 * (`FindNearbyPlotsUseCase`): latitud ±90, longitud ±180 y radio de 1 a 100 km
 * (el caso de uso acepta hasta 100 exclusivo; el contrato exige mínimo 1 km
 * para que el valor por defecto y el rango útil coincidan).
 * ──────────────────────────────────────────────────────────────────────────── */
export const nearbyPlotsQuerySchema = z.object({
  lat: z.coerce
    .number({ error: "La latitud es obligatoria" })
    .min(-90, "La latitud debe estar entre -90 y 90 grados")
    .max(90, "La latitud debe estar entre -90 y 90 grados"),
  lng: z.coerce
    .number({ error: "La longitud es obligatoria" })
    .min(-180, "La longitud debe estar entre -180 y 180 grados")
    .max(180, "La longitud debe estar entre -180 y 180 grados"),
  radius: z.coerce
    .number({ error: "El radio de búsqueda es obligatorio" })
    .min(1, "El radio de búsqueda debe estar entre 1 y 100 km")
    .max(100, "El radio de búsqueda debe estar entre 1 y 100 km")
    .default(10),
});

export type NearbyPlotsQuery = z.infer<typeof nearbyPlotsQuerySchema>;

/* ────────────────────────────────────────────────────────────────────────────
 * Geometría de la parcela — polígono GeoJSON simple
 *
 * Límites del territorio colombiano (bounding box), los mismos que valida
 * `geocode-validator` y que la base de datos comprueba con un CHECK sobre el
 * centroide calculado por PostGIS.
 * ──────────────────────────────────────────────────────────────────────────── */
export const COLOMBIA_GEO_BOUNDS = {
  minLat: -4.2,
  maxLat: 13.3,
  minLng: -79,
  maxLng: -66.8,
} as const;

/** Vértice del polígono en orden GeoJSON: `[longitud, latitud]`. */
export const plotPositionSchema = z.tuple([
  z
    .number({ error: "La longitud del vértice es obligatoria" })
    .min(
      COLOMBIA_GEO_BOUNDS.minLng,
      "La longitud del vértice debe estar entre -79 y -66.8 grados (Colombia)",
    )
    .max(
      COLOMBIA_GEO_BOUNDS.maxLng,
      "La longitud del vértice debe estar entre -79 y -66.8 grados (Colombia)",
    ),
  z
    .number({ error: "La latitud del vértice es obligatoria" })
    .min(
      COLOMBIA_GEO_BOUNDS.minLat,
      "La latitud del vértice debe estar entre -4.2 y 13.3 grados (Colombia)",
    )
    .max(
      COLOMBIA_GEO_BOUNDS.maxLat,
      "La latitud del vértice debe estar entre -4.2 y 13.3 grados (Colombia)",
    ),
]);

/** Tope de vértices de un anillo: evita geometrías enormes (DoS). */
export const MAX_PLOT_RING_VERTICES = 500;

/** Anillo del polígono: mínimo 3 vértices (triángulo mínimo), máximo 500. */
export const plotRingSchema = z
  .array(plotPositionSchema)
  .min(3, "El polígono de la parcela debe tener al menos 3 vértices")
  .max(
    MAX_PLOT_RING_VERTICES,
    `El polígono de la parcela no puede superar ${MAX_PLOT_RING_VERTICES} vértices`,
  );

/**
 * Polígono GeoJSON simple: `[[[lng, lat], ...]]`.
 *
 * Se exige UN único anillo (sin huecos): una parcela rural es un polígono
 * simple y así la geometría que entra a PostGIS es inequívoca.
 *
 * El total de vértices de todos los anillos también está acotado: es la
 * barrera de contrato frente a geometrías gigantes que agotarían CPU y
 * memoria del servidor (DoS).
 */
export const plotBoundarySchema = z
  .array(plotRingSchema)
  .min(1, "El polígono de la parcela debe tener al menos un anillo de vértices")
  .max(
    1,
    "El polígono de la parcela debe ser simple: un único anillo sin huecos",
  )
  .refine(
    (rings) =>
      rings.reduce((total, ring) => total + ring.length, 0) <=
      MAX_PLOT_RING_VERTICES,
    `El polígono de la parcela no puede superar ${MAX_PLOT_RING_VERTICES} vértices en total`,
  );

export type PlotPosition = z.infer<typeof plotPositionSchema>;
export type PlotBoundary = z.infer<typeof plotBoundarySchema>;

/* ────────────────────────────────────────────────────────────────────────────
 * Contrato API — POST /api/v1/plots
 *
 * El `farmerId` NO viaja en el cuerpo: lo toma el servidor de la sesión
 * autenticada (el controller lo inyecta en el caso de uso).
 * ──────────────────────────────────────────────────────────────────────────── */
export const createPlotSchema = z.object({
  name: z
    .string({ error: "El nombre de la parcela es obligatorio" })
    .trim()
    .min(3, "El nombre de la parcela debe tener al menos 3 caracteres")
    .max(120, "El nombre de la parcela no puede superar 120 caracteres"),
  municipality: z
    .string({ error: "El municipio es obligatorio" })
    .trim()
    .min(2, "El municipio debe tener al menos 2 caracteres")
    .max(120, "El municipio no puede superar 120 caracteres"),
  department: z
    .string({ error: "El departamento es obligatorio" })
    .trim()
    .min(2, "El departamento debe tener al menos 2 caracteres")
    .max(120, "El departamento no puede superar 120 caracteres"),
  boundary: plotBoundarySchema,
});

export type CreatePlotInput = z.infer<typeof createPlotSchema>;

/* ────────────────────────────────────────────────────────────────────────────
 * Contrato API — PATCH /api/v1/plots/:id
 *
 * Actualización parcial: todos los campos son opcionales, pero hay que enviar
 * al menos uno. Si llega `boundary`, PostGIS recalcula centroide y área.
 * ──────────────────────────────────────────────────────────────────────────── */
export const updatePlotSchema = z
  .object({
    name: createPlotSchema.shape.name.optional(),
    municipality: createPlotSchema.shape.municipality.optional(),
    department: createPlotSchema.shape.department.optional(),
    boundary: plotBoundarySchema.optional(),
  })
  .refine(
    (payload) => Object.keys(payload).length > 0,
    "Debes enviar al menos un campo para actualizar la parcela",
  );

export type UpdatePlotInput = z.infer<typeof updatePlotSchema>;

/* ────────────────────────────────────────────────────────────────────────────
 * Contrato API — GET|PATCH|DELETE /api/v1/plots/:id
 * ──────────────────────────────────────────────────────────────────────────── */
export const getPlotParamsSchema = z.object({
  id: z.uuid("El identificador de la parcela debe ser un UUID válido"),
});

export type GetPlotParams = z.infer<typeof getPlotParamsSchema>;

/* ────────────────────────────────────────────────────────────────────────────
 * Contrato API — respuesta de parcela (GET/POST/PATCH /api/v1/plots)
 *
 * `areaHectares` y `centroid` los calcula PostGIS (ST_Area / ST_Centroid);
 * el servidor solo los devuelve. `boundary` es el polígono GeoJSON tal como
 * lo almacena la base de datos.
 * ──────────────────────────────────────────────────────────────────────────── */
export const plotSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  municipality: z.string(),
  department: z.string(),
  farmerId: z.uuid(),
  areaHectares: z.number(),
  // `centroid` y `boundary` admiten `null`: la columna `geom` es nullable en
  // el esquema (una parcela puede existir sin geometría si se insertó por
  // una vía que no pasó por el trigger). El centroide y el área los calcula
  // PostGIS; el servidor solo los transporta.
  centroid: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .nullable(),
  boundary: plotBoundarySchema.nullable(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type PlotResponse = z.infer<typeof plotSchema>;

export const plotListSchema = z.array(plotSchema);

export type PlotListResponse = z.infer<typeof plotListSchema>;

/* ────────────────────────────────────────────────────────────────────────────
 * Contrato API — GET /api/v1/plots (listado propio, paginado)
 *
 * `limit` acota cuántas parcelas se devuelven (por defecto 20, máximo 100) y
 * `offset` desde cuál se empieza (por defecto 0). Evita que una finca con
 * muchas parcelas devuelva una respuesta ilimitada.
 * ──────────────────────────────────────────────────────────────────────────── */
export const listMyPlotsQuerySchema = z.object({
  limit: z.coerce
    .number({ error: "El límite de parcelas debe ser un número" })
    .int("El límite de parcelas debe ser un número entero")
    .min(1, "El límite de parcelas debe ser al menos 1")
    .max(100, "El límite de parcelas no puede superar 100")
    .default(20),
  offset: z.coerce
    .number({ error: "El desplazamiento debe ser un número" })
    .int("El desplazamiento debe ser un número entero")
    .min(0, "El desplazamiento no puede ser negativo")
    .default(0),
});

export type ListMyPlotsQuery = z.infer<typeof listMyPlotsQuerySchema>;

/* ────────────────────────────────────────────────────────────────────────────
 * Contrato API — respuesta de GET /api/v1/plots/nearby (PÚBLICA)
 *
 * Proyección reducida: NO expone `farmerId`, `boundary` ni `centroid` (datos
 * de la finca). Sí expone `distanceKm`, que PostGIS calcula con
 * `ST_Distance` y es el dato principal para un comprador.
 * ──────────────────────────────────────────────────────────────────────────── */
export const nearbyPlotSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  areaHectares: z.number(),
  municipality: z.string(),
  department: z.string(),
  createdAt: z.string().nullable(),
  distanceKm: z.number(),
});

export const nearbyPlotListSchema = z.array(nearbyPlotSchema);

export type NearbyPlotResponse = z.infer<typeof nearbyPlotSchema>;
export type NearbyPlotListResponse = z.infer<typeof nearbyPlotListSchema>;
