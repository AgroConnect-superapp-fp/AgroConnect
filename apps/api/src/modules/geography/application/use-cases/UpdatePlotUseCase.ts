// 🟡 APPLICATION LAYER - Caso de Uso

import { ApplicationError, DomainError } from '../../../../shared/errors/errors';
import type { Plot } from '../../domain/entities/Plot';
import type { PlotChanges, PlotRepository } from '../../domain/interfaces/PlotRepository';
import { createPlotBoundary, type PlotRing } from '../../domain/value-objects/PlotGeometry';
import { assertPlotWriteRole, type PlotActor } from '../plotRoles';

/** Campos que admite la actualización parcial de una parcela. */
export interface UpdatePlotCommand {
  name?: string;
  municipality?: string;
  department?: string;
  boundary?: readonly PlotRing[];
}

/**
 * Actualiza parcialmente una parcela del agricultor autenticado.
 *
 * Si llega `boundary`, el trigger de PostGIS recalcula centroide y área; el
 * caso de uso no toca esas medidas (SPEC §12).
 */
export class UpdatePlotUseCase {
  constructor(private readonly plotRepository: PlotRepository) {}

  async execute(actor: PlotActor, id: string, command: UpdatePlotCommand): Promise<Plot> {
    // Autorización por rol (capa de aplicación): solo productor o administrador.
    assertPlotWriteRole(actor);

    const farmerId = actor.id;

    const changes: PlotChanges = {};

    if (command.name !== undefined) {
      const name = command.name.trim();
      if (name.length < 3) {
        throw new DomainError(
          'VALIDATION_ERROR',
          'El nombre de la parcela debe tener al menos 3 caracteres',
          422,
        );
      }
      changes.name = name;
    }

    if (command.municipality !== undefined) {
      const municipality = command.municipality.trim();
      if (municipality.length < 2) {
        throw new DomainError(
          'VALIDATION_ERROR',
          'El municipio debe tener al menos 2 caracteres',
          422,
        );
      }
      changes.municipality = municipality;
    }

    if (command.department !== undefined) {
      const department = command.department.trim();
      if (department.length < 2) {
        throw new DomainError(
          'VALIDATION_ERROR',
          'El departamento debe tener al menos 2 caracteres',
          422,
        );
      }
      changes.department = department;
    }

    if (command.boundary !== undefined) {
      changes.boundary = createPlotBoundary(command.boundary);
    }

    if (Object.keys(changes).length === 0) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'Debes enviar al menos un campo para actualizar la parcela',
        422,
      );
    }

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

    // El repositorio filtra por id Y farmer_id: la propiedad se vuelve a
    // comprobar en la propia escritura (defensa contra carreras).
    const updated = await this.plotRepository.update(id, farmerId, changes);
    if (!updated) {
      throw new ApplicationError(
        'NOT_FOUND',
        'La parcela no existe o fue eliminada mientras se actualizaba',
        404,
      );
    }

    return updated;
  }
}
