// 🏛️ DOMAIN LAYER - Contrato (Interface)
// El dominio dice QUÉ necesita, la infraestructura dirá CÓMO lo hace.

import { Plot } from '../entities/Plot';

export interface PlotRepository {
  findById(id: string): Promise<Plot | null>;
  findNearby(lat: number, lng: number, radiusKm: number): Promise<Plot[]>;
  save(plot: Plot): Promise<Plot>;
}
