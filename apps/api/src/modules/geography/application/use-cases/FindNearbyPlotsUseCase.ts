// 🟡 APPLICATION LAYER - Caso de Uso
// Orquesta la lógica. NO sabe si los datos vienen de Prisma, MongoDB o una API.

import { Inject, Injectable } from '@nestjs/common';
import { PLOT_REPOSITORY } from '../tokens';
import { DomainError } from '../../../../shared/errors/errors';
import type { Plot } from '../../domain/entities/Plot';
import type { PlotRepository } from '../../domain/interfaces/PlotRepository';

/**
 * Búsqueda de parcelas cercanas a un punto geográfico.
 *
 * Portado del backend legacy (`backend/src/modules/geography`). La validación
 * de entrada se mantiene aquí como defensa en profundidad: la barrera primaria
 * es el esquema Zod del contrato (`nearbyPlotsQuerySchema`) aplicado en el
 * controller; si el caso de uso se invoca por otra vía, estas reglas siguen
 * protegiendo el dominio. Los errores usan `DomainError` (SPEC §9) con status
 * 400, el mismo código que respondía el legacy.
 */
@Injectable()
export class FindNearbyPlotsUseCase {
  // Inyección de Dependencias: Recibe la INTERFACE, no la implementación concreta
  constructor(@Inject(PLOT_REPOSITORY) private readonly plotRepository: PlotRepository) {}

  async execute(lat: number, lng: number, radiusKm: number): Promise<Plot[]> {
    // 1. Validación de entrada a nivel de aplicación
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'Coordenadas inválidas: la latitud debe estar entre -90 y 90 y la longitud entre -180 y 180',
        400,
      );
    }
    if (radiusKm <= 0 || radiusKm > 100) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'El radio de búsqueda debe estar entre 1 y 100 km',
        400,
      );
    }

    // 2. Llamada al repositorio (Contrato)
    return this.plotRepository.findNearby(lat, lng, radiusKm);
  }
}
