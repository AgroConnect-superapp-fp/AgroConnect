/**
 * Contratos del módulo geography (parcelas) — ÚNICA fuente de verdad (ADR-015).
 *
 * Los parámetros llegan como query string (strings en Express), así que el
 * contrato usa `z.coerce.number()`: la coerción ocurre en el servidor y el
 * tipo inferido ya es numérico para todos los consumidores TypeScript.
 */
import { z } from 'zod';

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
    .number({ error: 'La latitud es obligatoria' })
    .min(-90, 'La latitud debe estar entre -90 y 90 grados')
    .max(90, 'La latitud debe estar entre -90 y 90 grados'),
  lng: z.coerce
    .number({ error: 'La longitud es obligatoria' })
    .min(-180, 'La longitud debe estar entre -180 y 180 grados')
    .max(180, 'La longitud debe estar entre -180 y 180 grados'),
  radius: z.coerce
    .number({ error: 'El radio de búsqueda es obligatorio' })
    .min(1, 'El radio de búsqueda debe estar entre 1 y 100 km')
    .max(100, 'El radio de búsqueda debe estar entre 1 y 100 km')
    .default(10),
});

export type NearbyPlotsQuery = z.infer<typeof nearbyPlotsQuerySchema>;
