// 🟡 APPLICATION LAYER - Caso de Uso

import { ApplicationError, DomainError } from '../../../../shared/errors/errors';
import type { PlotRepository } from '../../domain/interfaces/PlotRepository';
import { assertPlotWriteRole, type PlotActor } from '../plotRoles';

/**
 * Elimina (soft delete) una parcela del agricultor autenticado.
 *
 * El borrado es lógico: la fila se marca con `deleted_at` y las consultas
 * activas la excluyen. Así se conserva la trazabilidad de la parcela.
 */
export class DeletePlotUseCase {
  constructor(private readonly plotRepository: PlotRepository) {}

  async execute(actor: PlotActor, id: string): Promise<void> {
    // Autorización por rol (capa de aplicación): solo productor o administrador.
    assertPlotWriteRole(actor);

    const farmerId = actor.id;

    const existing = await this.plotRepository.findById(id);
    if (!existing || existing.deletedAt) {
      throw new DomainError('NOT_FOUND', 'La parcela no existe', 404);
    }

    if (!existing.belongsTo(farmerId)) {
      throw new DomainError(
        'FORBIDDEN',
        'La parcela pertenece a otro agricultor',
        403,
      );
    }

    // El repositorio filtra por id Y farmer_id.
    const deleted = await this.plotRepository.delete(id, farmerId);
    if (!deleted) {
      throw new ApplicationError(
        'NOT_FOUND',
        'La parcela no existe o fue eliminada mientras se procesaba la petición',
        404,
      );
    }
  }
}
