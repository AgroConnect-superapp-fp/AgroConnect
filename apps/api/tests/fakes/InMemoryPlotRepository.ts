import { Plot } from '../../src/modules/geography/domain/entities/Plot';
import type { PlotRepository } from '../../src/modules/geography/domain/interfaces/PlotRepository';

/**
 * Doble de prueba del puerto `PlotRepository`.
 *
 * `findNearby` NO implementa geometría: devuelve todas las parcelas
 * registradas y deja constancia de los parámetros recibidos. La búsqueda
 * geoespacial real (`ST_DWithin`) se verifica en la prueba e2e contra PostGIS.
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
    return this.plots;
  }

  async save(plot: Plot): Promise<Plot> {
    this.plots.push(plot);
    return plot;
  }
}
