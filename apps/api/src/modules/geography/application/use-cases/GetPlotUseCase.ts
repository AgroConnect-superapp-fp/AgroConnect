// 🟡 APPLICATION LAYER - Caso de Uso

import { DomainError } from '../../../../shared/errors/errors';
import type { Plot } from '../../domain/entities/Plot';
import type { PlotRepository } from '../../domain/interfaces/PlotRepository';

/**
 * Obtiene una parcela del agricultor autenticado.
 *
 * Ownership: una parcela que existe pero pertenece a otro agricultor responde
 * 403 (no 404), para que el cliente distinga "no existe" de "no es tuya".
 */
export class GetPlotUseCase {
  constructor(private readonly plotRepository: PlotRepository) {}

  async execute(farmerId: string, id: string): Promise<Plot> {
    if (!farmerId) {
      throw new DomainError(
        'UNAUTHORIZED',
        'Se requiere una sesión autenticada para consultar la parcela',
        401,
      );
    }

    const plot = await this.plotRepository.findById(id);
    if (!plot || plot.deletedAt) {
      throw new DomainError('NOT_FOUND', 'La parcela no existe', 404);
    }

    if (!plot.belongsTo(farmerId)) {
      throw new DomainError(
        'FORBIDDEN',
        'La parcela pertenece a otro agricultor',
        403,
      );
    }

    return plot;
  }
}
