// 🟡 APPLICATION LAYER - Caso de Uso
// Orquesta la lógica. NO sabe si los datos vienen de Prisma, MongoDB o una API.

import { DomainError } from '../../../../shared/errors/errors';
import type { Plot } from '../../domain/entities/Plot';
import type { PlotRepository } from '../../domain/interfaces/PlotRepository';
import { createPlotBoundary, type PlotRing } from '../../domain/value-objects/PlotGeometry';
import { assertPlotWriteRole, type PlotActor } from '../plotRoles';

/**
 * Datos de alta de una parcela.
 *
 * `boundary` es el anillo del polígono en orden GeoJSON (`[[lng, lat], ...]`).
 * El `farmerId` NO viaja en el comando: lo toma el servidor de la sesión
 * autenticada, así un cliente no puede registrar parcelas a nombre de otro.
 */
export interface CreatePlotCommand {
  name: string;
  municipality: string;
  department: string;
  boundary: readonly PlotRing[];
}

/**
 * Registra una parcela con su geometría.
 *
 * El área y el centroide NO se calculan aquí: los deriva el trigger de
 * PostGIS a partir del polígono (SPEC §12). La validación de entrada tiene
 * tres barreras: el contrato Zod (primaria, en el controller), la regla de rol
 * (autoritativa, en esta capa) y las reglas puras del dominio.
 */
export class CreatePlotUseCase {
  // Inyección de Dependencias: Recibe la INTERFACE, no la implementación concreta
  constructor(private readonly plotRepository: PlotRepository) {}

  async execute(actor: PlotActor, command: CreatePlotCommand): Promise<Plot> {
    // Autorización por rol (capa de aplicación): solo productor o administrador.
    assertPlotWriteRole(actor);

    const name = command.name.trim();
    if (name.length < 3) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'El nombre de la parcela debe tener al menos 3 caracteres',
        422,
      );
    }

    const municipality = command.municipality.trim();
    if (municipality.length < 2) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'El municipio debe tener al menos 2 caracteres',
        422,
      );
    }

    const department = command.department.trim();
    if (department.length < 2) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'El departamento debe tener al menos 2 caracteres',
        422,
      );
    }

    // El value object valida la geometría (un anillo, 3+ vértices, Colombia).
    const boundary = createPlotBoundary(command.boundary);

    return this.plotRepository.create({
      name,
      municipality,
      department,
      farmerId: actor.id,
      boundary,
    });
  }
}
