// 🏛️ DOMAIN LAYER - Entidad Pura (No conoce NestJS, No conoce Prisma)

import {
  isWithinColombia,
  type PlotBoundary,
  type PlotCentroid,
} from '../value-objects/PlotGeometry';

/**
 * Datos de una parcela.
 *
 * `areaHectares` y `centroid` los calcula PostGIS (ST_Area / ST_Centroid) en
 * el trigger de la tabla `plots`; el dominio los transporta sin recalcularlos
 * (SPEC §12: las medidas geoespaciales no se calculan en JavaScript).
 *
 * `boundary` es el polígono GeoJSON almacenado en la columna `geom`.
 */
export interface PlotProps {
  id: string;
  name: string;
  areaHectares: number;
  municipality: string;
  department: string;
  farmerId: string;
  boundary: PlotBoundary | null;
  centroid: PlotCentroid | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
  /**
   * Distancia al punto de búsqueda, en kilómetros.
   *
   * Solo se rellena en las consultas de proximidad (`findNearby`); lo calcula
   * PostGIS con `ST_Distance` sobre la geografía, nunca JavaScript.
   */
  distanceKm?: number;
}

export class Plot {
  public readonly props: PlotProps;

  constructor(props: PlotProps) {
    this.props = {
      ...props,
      // Las marcas de tiempo se normalizan a `null` (nunca `undefined`): el
      // dominio representa "sin dato" de forma uniforme en las tres columnas.
      createdAt: props.createdAt ?? null,
      updatedAt: props.updatedAt ?? null,
      deletedAt: props.deletedAt ?? null,
    };
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get areaHectares(): number {
    return this.props.areaHectares;
  }

  get municipality(): string {
    return this.props.municipality;
  }

  get department(): string {
    return this.props.department;
  }

  get farmerId(): string {
    return this.props.farmerId;
  }

  get boundary(): PlotBoundary | null {
    return this.props.boundary;
  }

  get centroid(): PlotCentroid | null {
    return this.props.centroid;
  }

  /**
   * Fecha de creación.
   *
   * El getter mantiene el contrato opcional (`Date | undefined`) de la entidad;
   * la normalización a `null` vive en `props` (estado interno).
   */
  get createdAt(): Date | undefined {
    return this.props.createdAt ?? undefined;
  }

  /** Fecha de última actualización (mismo contrato opcional que `createdAt`). */
  get updatedAt(): Date | undefined {
    return this.props.updatedAt ?? undefined;
  }

  /** Fecha de eliminación lógica; `null` mientras la parcela está vigente. */
  get deletedAt(): Date | null {
    return this.props.deletedAt ?? null;
  }

  /** Distancia al punto de búsqueda (solo en consultas de proximidad). */
  get distanceKm(): number | undefined {
    return this.props.distanceKm;
  }

  // Reglas de negocio puras (ej. validación de dominio)

  /** La parcela está ubicada en el departamento del Quindío. */
  isLocatedInQuindio(): boolean {
    return this.props.department === 'Quindío';
  }

  /** El centroide calculado por PostGIS cae dentro del bounding box de Colombia. */
  isWithinColombia(): boolean {
    return isWithinColombia(this.props.centroid);
  }

  /** La parcela tiene geometría utilizable (un anillo con al menos 3 vértices). */
  hasBoundary(): boolean {
    const boundary = this.props.boundary;
    if (!boundary) {
      return false;
    }

    const ring = boundary.coordinates[0];
    return Array.isArray(ring) && ring.length >= 3;
  }

  /** La parcela pertenece al agricultor indicado (ownership). */
  belongsTo(farmerId: string): boolean {
    return this.props.farmerId === farmerId;
  }
}
