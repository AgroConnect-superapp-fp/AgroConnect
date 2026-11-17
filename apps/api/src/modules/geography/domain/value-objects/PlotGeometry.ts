// 🏛️ DOMAIN LAYER - Value Objects de la geometría de la parcela
// (No conoce NestJS, No conoce Prisma, No calcula PostGIS)

import { DomainError } from '../../../../shared/errors/errors';

/**
 * Vértice del polígono en orden GeoJSON: `[longitud, latitud]`.
 *
 * El orden es el de GeoJSON (primero longitud), NO el de lat/lng habitual en
 * los mapas. El contrato Zod y la base de datos usan el mismo orden.
 */
export type PlotVertex = readonly [number, number];

/** Anillo del polígono: una secuencia cerrada de vértices. */
export type PlotRing = readonly PlotVertex[];

/**
 * Polígono GeoJSON simple de la parcela.
 *
 * Se admite UN único anillo (sin huecos): una parcela rural es un polígono
 * simple y así la geometría que entra a PostGIS es inequívoca.
 */
export interface PlotBoundary {
  readonly type: 'Polygon';
  readonly coordinates: readonly PlotRing[];
}

/**
 * Centroide de la parcela.
 *
 * Lo calcula PostGIS con `ST_Centroid` (trigger de la tabla `plots`); el
 * dominio solo lo transporta y lo contrasta con las reglas puras.
 */
export interface PlotCentroid {
  readonly lat: number;
  readonly lng: number;
}

/**
 * Bounding box de Colombia.
 *
 * Mismo rango que valida el contrato Zod (`plotSchemas.ts`) y que comprueba
 * el CHECK de la base de datos (`ST_Within` con `ST_MakeEnvelope`).
 */
export const COLOMBIA_GEO_BOUNDS = {
  minLat: -4.2,
  maxLat: 13.3,
  minLng: -79,
  maxLng: -66.8,
} as const;

/** Número mínimo de vértices de un polígono (triángulo mínimo). */
export const MIN_PLOT_VERTICES = 3;

/**
 * Tope de vértices de un anillo.
 *
 * Un polígono con miles de vértices es una vía barata de agotar CPU y memoria
 * (DoS): el límite coincide con el del contrato compartido (`plotRingSchema`).
 */
export const MAX_PLOT_VERTICES = 500;

/**
 * Tolerancia del predicado de degeneración (en grados²).
 *
 * El predicado de anillo degenerado NO calcula el área de la parcela (esa es
 * tarea de PostGIS, SPEC §12): solo detecta que el polígono no enclose
 * ninguna superficie, lo que haría que `ST_Area` devolviera 0.
 */
const DEGENERATE_AREA_EPSILON = 1e-12;

/**
 * Comprueba si un valor es un array sin degradar el tipo a `any[]`.
 *
 * `Array.isArray` es un type guard que estrecha a `any[]`; al aplicarlo sobre
 * un parámetro ya tipado (`readonly PlotRing[]`) el tipo se pierde y el
 * linter rechaza la asignación por `any` inseguro. Este helper devuelve un
 * `boolean` simple: mantiene la misma comprobación en runtime y conserva el
 * tipo estático del parámetro.
 */
function isArrayLike(value: unknown): boolean {
  return Array.isArray(value);
}

/**
 * Construye el value object `PlotBoundary` validando la geometría.
 *
 * Reglas puras (sin efectos de borde):
 * - exactamente un anillo;
 * - al menos tres vértices;
 * - vértices con números finitos dentro del bounding box de Colombia.
 *
 * El área y el centroide NO se calculan aquí: eso es trabajo de PostGIS
 * (SPEC §12 prohíbe calcular distancias y áreas geoespaciales en JavaScript).
 */
export function createPlotBoundary(rings: readonly PlotRing[]): PlotBoundary {
  if (!isArrayLike(rings) || rings.length !== 1) {
    throw new DomainError(
      'VALIDATION_ERROR',
      'El polígono de la parcela debe ser simple: un único anillo sin huecos',
      422,
    );
  }

  const ring = rings[0];
  if (!ring || !isArrayLike(ring) || ring.length < MIN_PLOT_VERTICES) {
    throw new DomainError(
      'VALIDATION_ERROR',
      `El polígono de la parcela debe tener al menos ${MIN_PLOT_VERTICES} vértices`,
      422,
    );
  }

  if (ring.length > MAX_PLOT_VERTICES) {
    throw new DomainError(
      'VALIDATION_ERROR',
      `El polígono de la parcela no puede superar ${MAX_PLOT_VERTICES} vértices`,
      422,
    );
  }

  for (const vertex of ring) {
    if (!isArrayLike(vertex) || vertex.length !== 2) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'Cada vértice del polígono debe tener longitud y latitud',
        422,
      );
    }

    const [lng, lat] = vertex;
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'Las coordenadas del polígono deben ser números válidos',
        422,
      );
    }

    if (
      lng < COLOMBIA_GEO_BOUNDS.minLng ||
      lng > COLOMBIA_GEO_BOUNDS.maxLng ||
      lat < COLOMBIA_GEO_BOUNDS.minLat ||
      lat > COLOMBIA_GEO_BOUNDS.maxLat
    ) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'El polígono de la parcela debe estar dentro del territorio colombiano',
        422,
      );
    }
  }

  // GeoJSON (RFC 7946) exige que el anillo esté cerrado: el primer y el
  // último vértice son idénticos. `ST_GeomFromGeoJSON` NO cierra el anillo, y
  // un polígono abierto es inválido para PostGIS (`ST_Area` devolvería 0 y el
  // trigger no podría derivar el área de la parcela).
  const closedRing = closeRing(ring);

  // Reglas puras de validez que no necesitan PostGIS: un anillo con vértices
  // duplicados consecutivos o degenerado (área cero) produciría una
  // geometría que PostGIS rechaza (CHECK `plots_geom_valid_check`).
  assertNoConsecutiveDuplicates(closedRing);
  assertNonDegenerateRing(closedRing);

  return { type: 'Polygon', coordinates: [closedRing] };
}

/**
 * Rechaza vértices duplicados consecutivos.
 *
 * Un vértice repetido hace que el polígono sea inválido para PostGIS
 * (`ST_IsValid` devuelve falso) y que el área no sea fiable.
 */
function assertNoConsecutiveDuplicates(ring: PlotRing): void {
  for (let index = 1; index < ring.length; index += 1) {
    const previous = ring[index - 1];
    const current = ring[index];
    if (!previous || !current) {
      continue;
    }

    if (previous[0] === current[0] && previous[1] === current[1]) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'El polígono de la parcela no puede tener vértices duplicados consecutivos',
        422,
      );
    }
  }
}

/**
 * Rechaza anillos degenerados (tres o más vértices colineales).
 *
 * Es un PREDICADO DE VALIDEZ, no el cálculo del área de la parcela: el área
 * oficial la deriva PostGIS con `ST_Area` (SPEC §12). Aquí solo se detecta que
 * el polígono no enclose superficie alguna, porque en ese caso `ST_Area`
 * devolvería 0 y el CHECK `plots_area_positive_check` rechazaría la fila.
 */
function assertNonDegenerateRing(ring: PlotRing): void {
  let twiceSignedArea = 0;

  for (let index = 0; index < ring.length - 1; index += 1) {
    const current = ring[index];
    const next = ring[index + 1];
    if (!current || !next) {
      continue;
    }

    twiceSignedArea += current[0] * next[1] - next[0] * current[1];
  }

  if (Math.abs(twiceSignedArea) < DEGENERATE_AREA_EPSILON) {
    throw new DomainError(
      'VALIDATION_ERROR',
      'El polígono de la parcela está degenerado: sus vértices son colineales y no encierran superficie',
      422,
    );
  }
}

/**
 * Cierra el anillo del polígono si todavía no lo está.
 *
 * Si el cliente ya envió el anillo cerrado (primer y último vértice
 * iguales), se devuelve tal cual: no se duplica el vértice de cierre.
 */
function closeRing(ring: PlotRing): PlotRing {
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!first || !last) {
    return ring;
  }

  if (first[0] === last[0] && first[1] === last[1]) {
    return ring;
  }

  return [...ring, first];
}

/** Construye el value object `PlotCentroid` validando los números. */
export function createPlotCentroid(lat: number, lng: number): PlotCentroid {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new DomainError(
      'VALIDATION_ERROR',
      'El centroide de la parcela tiene coordenadas inválidas',
      422,
    );
  }

  return { lat, lng };
}

/** Regla pura: las coordenadas caen dentro del bounding box de Colombia. */
export function isWithinColombia(centroid: PlotCentroid | null): boolean {
  if (!centroid) {
    return false;
  }

  return (
    centroid.lat >= COLOMBIA_GEO_BOUNDS.minLat &&
    centroid.lat <= COLOMBIA_GEO_BOUNDS.maxLat &&
    centroid.lng >= COLOMBIA_GEO_BOUNDS.minLng &&
    centroid.lng <= COLOMBIA_GEO_BOUNDS.maxLng
  );
}
