import { randomUUID } from 'node:crypto';
import { Plot } from '../../src/modules/geography/domain/entities/Plot';
import type {
  NewPlotData,
  PlotChanges,
  PlotPagination,
  PlotRepository,
} from '../../src/modules/geography/domain/interfaces/PlotRepository';

/**
 * Doble de prueba del puerto `PlotRepository`.
 *
 * `findNearby` NO implementa geometría: devuelve las parcelas registradas
 * (excluye las eliminadas lógicamente) y deja constancia de los parámetros
 * recibidos. La búsqueda geoespacial real (`ST_DWithin`) se verifica en la
 * prueba e2e contra PostGIS.
 *
 * `create` NO calcula centroide ni área (eso es trabajo de PostGIS): la
 * parcela nace con `areaHectares = 0` y `centroid = null`, igual que una
 * fila recién insertada antes de que el trigger actúe.
 */
export class InMemoryPlotRepository implements PlotRepository {
  plots: Plot[] = [];
  lastQuery: { lat: number; lng: number; radiusKm: number } | null = null;

  seedPlot(plot: Plot): void {
    this.plots.push(plot);
  }

  async findById(id: string): Promise<Plot | null> {
    return this.plots.find((plot) => plot.id === id) ?? null;
  }

  async findNearby(lat: number, lng: number, radiusKm: number): Promise<Plot[]> {
    this.lastQuery = { lat, lng, radiusKm };
    return this.plots.filter((plot) => !plot.deletedAt);
  }

  async findByFarmer(farmerId: string, pagination: PlotPagination): Promise<Plot[]> {
    const owned = this.plots.filter((plot) => plot.farmerId === farmerId && !plot.deletedAt);
    return owned.slice(pagination.offset, pagination.offset + pagination.limit);
  }

  async create(data: NewPlotData): Promise<Plot> {
    const now = new Date();
    const plot = new Plot({
      id: randomUUID(),
      name: data.name,
      areaHectares: 0,
      municipality: data.municipality,
      department: data.department,
      farmerId: data.farmerId,
      boundary: data.boundary,
      centroid: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });

    this.plots.push(plot);
    return plot;
  }

  async update(id: string, farmerId: string, changes: PlotChanges): Promise<Plot | null> {
    const index = this.plots.findIndex(
      (plot) => plot.id === id && plot.farmerId === farmerId && !plot.deletedAt,
    );
    if (index === -1) {
      return null;
    }

    const current = this.plots[index];
    if (!current) {
      return null;
    }

    const updated = new Plot({
      ...current.props,
      name: changes.name ?? current.name,
      municipality: changes.municipality ?? current.municipality,
      department: changes.department ?? current.department,
      boundary: changes.boundary ?? current.boundary,
      updatedAt: new Date(),
    });

    this.plots[index] = updated;
    return updated;
  }

  async delete(id: string, farmerId: string): Promise<boolean> {
    const index = this.plots.findIndex(
      (plot) => plot.id === id && plot.farmerId === farmerId && !plot.deletedAt,
    );
    if (index === -1) {
      return false;
    }

    const current = this.plots[index];
    if (!current) {
      return false;
    }

    this.plots[index] = new Plot({
      ...current.props,
      deletedAt: new Date(),
      updatedAt: new Date(),
    });

    return true;
  }
}
