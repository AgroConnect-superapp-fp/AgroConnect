// 🟡 APPLICATION LAYER - Caso de Uso
// Orquesta la lógica. NO sabe si los datos vienen de Prisma, MongoDB o una API.

import { PlotRepository } from '../../domain/interfaces/PlotRepository';

export class FindNearbyPlotsUseCase {
  // Inyección de Dependencias: Recibe la INTERFACE, no la implementación concreta
  constructor(private readonly plotRepository: PlotRepository) {}

  async execute(lat: number, lng: number, radiusKm: number) {
    // 1. Validación de entrada a nivel de aplicación
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new Error('Coordenadas inválidas');
    }
    if (radiusKm <= 0 || radiusKm > 100) {
      throw new Error('El radio debe ser entre 0 y 100 km');
    }

    // 2. Llamada al repositorio (Contrato)
    return await this.plotRepository.findNearby(lat, lng, radiusKm);
  }
}
