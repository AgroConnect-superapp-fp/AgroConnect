// 🏛️ DOMAIN LAYER - Contrato (Interface)
// El dominio dice QUÉ necesita, la infraestructura dirá CÓMO lo hace.

import type { Plot } from '../entities/Plot';
import type { PlotBoundary } from '../value-objects/PlotGeometry';

/**
 * Ventana de paginación del listado de parcelas.
 *
 * `limit` acota cuántas parcelas se devuelven y `offset` desde cuál se
 * empieza. Los límites los fija el contrato compartido y los repite el caso
 * de uso (defensa en profundidad).
 */
export interface PlotPagination {
  limit: number;
  offset: number;
}

/** Datos mínimos para registrar una parcela nueva. */
export interface NewPlotData {
  name: string;
  municipality: string;
  department: string;
  farmerId: string;
  boundary: PlotBoundary;
}

/** Campos que admite una actualización parcial de la parcela. */
export interface PlotChanges {
  name?: string;
  municipality?: string;
  department?: string;
  boundary?: PlotBoundary;
}

export interface PlotRepository {
  /** Parcela por id (incluye las eliminadas lógicamente: el caso de uso decide). */
  findById(id: string): Promise<Plot | null>;
  /** Parcelas dentro del radio, ordenadas por distancia ascendente. */
  findNearby(lat: number, lng: number, radiusKm: number): Promise<Plot[]>;
  /** Parcelas del agricultor (solo las activas), paginadas. */
  findByFarmer(farmerId: string, pagination: PlotPagination): Promise<Plot[]>;
  /** Registra la parcela; el área y el centroide los calcula PostGIS. */
  create(data: NewPlotData): Promise<Plot>;
  /**
   * Actualiza la parcela del agricultor indicado.
   * Devuelve `null` si no existe o no le pertenece (filtra por id y farmer_id).
   */
  update(id: string, farmerId: string, changes: PlotChanges): Promise<Plot | null>;
  /** Soft delete: marca `deleted_at`. Devuelve `false` si no había parcela. */
  delete(id: string, farmerId: string): Promise<boolean>;
}
