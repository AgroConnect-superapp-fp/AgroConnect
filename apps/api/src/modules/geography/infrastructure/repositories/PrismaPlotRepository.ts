import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '../../../../generated/prisma/client';
import { Plot } from '../../domain/entities/Plot';
import type {
  NewPlotData,
  PlotChanges,
  PlotPagination,
  PlotRepository,
} from '../../domain/interfaces/PlotRepository';
import type {
  PlotBoundary,
  PlotRing,
  PlotVertex,
} from '../../domain/value-objects/PlotGeometry';
import { DomainError } from '../../../../shared/errors/errors';
import { logger } from '../../../../shared/logger/logger';
import {
  checkConstraintName,
  isCheckConstraintViolation,
} from '../../../../shared/infrastructure/prismaErrors';

/**
 * Fila cruda que devuelve Postgres para las consultas SQL de parcelas.
 *
 * `centroid_lat` / `centroid_lng` se derivan en SQL del centroide que calcula
 * el trigger; `geom_geojson` es el polígono serializado por PostGIS.
 */
interface PlotRow {
  id: string;
  name: string;
  area_hectares: number;
  municipality: string;
  department: string;
  farmer_id: string;
  centroid_lat: number | null;
  centroid_lng: number | null;
  geom_geojson: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  distance_m?: number | null;
}

/**
 * Tope de resultados de la búsqueda de proximidad.
 *
 * La búsqueda por radio es pública y sin paginación; el tope evita que una
 * zona densamente parcelada devuelva una respuesta ilimitada.
 */
export const MAX_NEARBY_RESULTS = 100;

/**
 * Proyección SQL común: geometría y marcas de tiempo en el mismo formato.
 *
 * Es un fragmento `Prisma.sql` (constante del repositorio, no dato de
 * usuario): se incrusta en el texto de la consulta sin convertirse en
 * parámetro vinculado.
 */
const PLOT_COLUMNS = Prisma.sql`
  id,
  name,
  area_hectares,
  municipality,
  department,
  farmer_id,
  ST_Y(centroid::geometry) AS centroid_lat,
  ST_X(centroid::geometry) AS centroid_lng,
  ST_AsGeoJSON(geom) AS geom_geojson,
  created_at,
  updated_at,
  deleted_at
`;

/**
 * Repositorio de parcelas sobre Prisma + PostGIS.
 *
 * Toda la geometría se resuelve en PostgreSQL (SPEC §12): el centroide y el
 * área los deriva el trigger `plots_sync_geometry_trigger` a partir del
 * polígono, y la búsqueda por proximidad usa `ST_DWithin` + `ST_Distance`.
 *
 * Todas las consultas usan tagged templates de Prisma (`$queryRaw` /
 * `$executeRaw`): los valores del usuario viajan como parámetros vinculados,
 * nunca interpolados en el texto SQL.
 *
 * `PrismaClient` se inyecta como alias de `PrismaService` (ver
 * `prisma/prisma.module.ts`), igual que el resto de repositorios portados.
 */
@Injectable()
export class PrismaPlotRepository implements PlotRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Plot | null> {
    const rows = await this.prisma.$queryRaw<PlotRow[]>`
      SELECT ${PLOT_COLUMNS}
      FROM plots
      WHERE id = ${id}::uuid
      LIMIT 1
    `;

    const record = rows[0];
    return record ? this.toDomain(record) : null;
  }

  async findNearby(lat: number, lng: number, radiusKm: number): Promise<Plot[]> {
    const records = await this.prisma.$queryRaw<PlotRow[]>`
      SELECT
        ${PLOT_COLUMNS},
        ST_Distance(
          centroid::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) AS distance_m
      FROM plots
      WHERE deleted_at IS NULL
        AND ST_DWithin(
          centroid::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusKm * 1000}
        )
      ORDER BY distance_m ASC
      LIMIT ${MAX_NEARBY_RESULTS}
    `;

    return records.map((record) => this.toDomain(record));
  }

  async findByFarmer(farmerId: string, pagination: PlotPagination): Promise<Plot[]> {
    const records = await this.prisma.$queryRaw<PlotRow[]>`
      SELECT ${PLOT_COLUMNS}
      FROM plots
      WHERE farmer_id = ${farmerId}::uuid
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT ${pagination.limit}
      OFFSET ${pagination.offset}
    `;

    return records.map((record) => this.toDomain(record));
  }

  async create(data: NewPlotData): Promise<Plot> {
    const id = randomUUID();
    const geojson = JSON.stringify(data.boundary);

    // El trigger `plots_sync_geometry_trigger` calcula `centroid` y
    // `area_hectares` a partir del polígono: la aplicación no los calcula.
    let rows: PlotRow[];
    try {
      rows = await this.prisma.$queryRaw<PlotRow[]>`
        INSERT INTO plots (id, name, municipality, department, farmer_id, geom)
        VALUES (
          ${id}::uuid,
          ${data.name},
          ${data.municipality},
          ${data.department},
          ${data.farmerId}::uuid,
          ST_GeomFromGeoJSON(${geojson}::text)
        )
        RETURNING ${PLOT_COLUMNS}
      `;
    } catch (error) {
      throw mapGeometryConstraintError(error);
    }

    const record = rows[0];
    if (!record) {
      throw new Error('La inserción de la parcela no devolvió la fila creada');
    }

    return this.toDomain(record);
  }

  async update(id: string, farmerId: string, changes: PlotChanges): Promise<Plot | null> {
    const geojson = changes.boundary ? JSON.stringify(changes.boundary) : null;

    // `COALESCE` conserva el valor vigente cuando el campo no viene en el
    // PATCH. El trigger vuelve a derivar centroide y área si cambia `geom`.
    let rows: PlotRow[];
    try {
      rows = await this.prisma.$queryRaw<PlotRow[]>`
        UPDATE plots
        SET
          name = COALESCE(${changes.name ?? null}, name),
          municipality = COALESCE(${changes.municipality ?? null}, municipality),
          department = COALESCE(${changes.department ?? null}, department),
          geom = COALESCE(ST_GeomFromGeoJSON(${geojson}::text), geom),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}::uuid
          AND farmer_id = ${farmerId}::uuid
          AND deleted_at IS NULL
        RETURNING ${PLOT_COLUMNS}
      `;
    } catch (error) {
      throw mapGeometryConstraintError(error);
    }

    const record = rows[0];
    return record ? this.toDomain(record) : null;
  }

  async delete(id: string, farmerId: string): Promise<boolean> {
    const affected = await this.prisma.$executeRaw`
      UPDATE plots
      SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}::uuid
        AND farmer_id = ${farmerId}::uuid
        AND deleted_at IS NULL
    `;

    return affected > 0;
  }

  private toDomain(record: PlotRow): Plot {
    const centroid =
      record.centroid_lat !== null && record.centroid_lng !== null
        ? { lat: record.centroid_lat, lng: record.centroid_lng }
        : null;

    const distanceKm =
      typeof record.distance_m === 'number' ? record.distance_m / 1000 : undefined;

    return new Plot({
      id: record.id,
      name: record.name,
      areaHectares: record.area_hectares,
      municipality: record.municipality,
      department: record.department,
      farmerId: record.farmer_id,
      boundary: parseBoundary(record.geom_geojson, record.id),
      centroid,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      deletedAt: record.deleted_at,
      ...(distanceKm !== undefined ? { distanceKm } : {}),
    });
  }
}

/**
 * Convierte el GeoJSON que devuelve PostGIS en el value object del dominio.
 *
 * Un polígono corrupto en la base de datos no debe tumbar la API: se registra
 * y se devuelve `null` (la parcela queda sin geometría en la respuesta).
 */
function parseBoundary(raw: string | null, plotId: string): PlotBoundary | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPolygon(parsed)) {
      // SPEC §5: la geometría de la finca es dato sensible (GPS). El log NO
      // incluye el GeoJSON: solo el identificador de la parcela y el motivo.
      logger.warn(
        { plotId, reason: 'formato_inesperado' },
        'Geometría de parcela con formato inesperado',
      );
      return null;
    }

    return { type: 'Polygon', coordinates: toPlotRings(parsed.coordinates) };
  } catch (error) {
    // El mensaje de `JSON.parse` puede incluir un fragmento del GeoJSON: se
    // registra solo el tipo de error, nunca el contenido de la geometría.
    logger.error(
      { plotId, errorType: error instanceof Error ? error.name : 'Unknown' },
      'No se pudo interpretar la geometría de la parcela',
    );
    return null;
  }
}

/**
 * Traduce la violación de un CHECK de Postgres a un error de dominio 422.
 *
 * Un polígono auto-intersectado o degenerado lo rechaza la base de datos
 * (`plots_geom_valid_check`, `plots_area_positive_check`,
 * `plots_centroid_colombia_check`). Sin este mapeo el error de Postgres
 * llegaba al filtro global como HTTP 500; con él, el cliente recibe un 422
 * con un mensaje accionable.
 */
function mapGeometryConstraintError(error: unknown): unknown {
  if (!isCheckConstraintViolation(error)) {
    return error;
  }

  const constraint = checkConstraintName(error);

  if (constraint === 'plots_geom_valid_check') {
    return new DomainError(
      'VALIDATION_ERROR',
      'La geometría de la parcela no es válida: el polígono se auto-intersecta o tiene vértices duplicados',
      422,
    );
  }

  if (constraint === 'plots_area_positive_check') {
    return new DomainError(
      'VALIDATION_ERROR',
      'La parcela debe tener un área mayor que cero: el polígono está degenerado (vértices colineales)',
      422,
    );
  }

  if (constraint === 'plots_centroid_colombia_check') {
    return new DomainError(
      'VALIDATION_ERROR',
      'El centroide calculado de la parcela cae fuera del territorio colombiano',
      422,
    );
  }

  return new DomainError(
    'VALIDATION_ERROR',
    'La geometría de la parcela no cumple las restricciones de la base de datos',
    422,
  );
}

/**
 * Convierte los anillos del GeoJSON crudo en los value objects del dominio.
 *
 * La conversión es explícita y validada (sin casts): cada vértice debe tener
 * exactamente dos números finitos (lng, lat). Un polígono corrupto en la base
 * de datos lanza `DomainError`, que `parseBoundary` degrada a `null` con su
 * registro en el log.
 */
function toPlotRings(coordinates: number[][][]): PlotRing[] {
  return coordinates.map((ring) => {
    const vertices: PlotVertex[] = ring.map((vertex) => {
      if (!Array.isArray(vertex) || vertex.length !== 2) {
        throw new DomainError(
          'VALIDATION_ERROR',
          'La geometría almacenada de la parcela tiene vértices inválidos',
          422,
        );
      }

      const [lng, lat] = vertex;
      if (
        typeof lng !== 'number' ||
        typeof lat !== 'number' ||
        !Number.isFinite(lng) ||
        !Number.isFinite(lat)
      ) {
        throw new DomainError(
          'VALIDATION_ERROR',
          'La geometría almacenada de la parcela tiene coordenadas inválidas',
          422,
        );
      }

      const plotVertex: PlotVertex = [lng, lat];
      return plotVertex;
    });

    return vertices;
  });
}

/** Type guard del polígono GeoJSON que devuelve `ST_AsGeoJSON`. */
function isPolygon(
  value: unknown,
): value is { type: 'Polygon'; coordinates: number[][][] } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as { type?: unknown; coordinates?: unknown };
  if (candidate.type !== 'Polygon' || !Array.isArray(candidate.coordinates)) {
    return false;
  }

  return candidate.coordinates.every(
    (ring: unknown) =>
      Array.isArray(ring) &&
      ring.every(
        (vertex: unknown) =>
          Array.isArray(vertex) &&
          vertex.length === 2 &&
          vertex.every((coordinate: unknown) => typeof coordinate === 'number'),
      ),
  );
}
