// 🟡 APPLICATION LAYER - Caso de Uso

import { DomainError } from '../../../../shared/errors/errors';
import type { Plot } from '../../domain/entities/Plot';
import type { PlotPagination, PlotRepository } from '../../domain/interfaces/PlotRepository';
import { assertPlotWriteRole, type PlotActor } from '../plotRoles';

/** Número de parcelas devueltas por defecto en el listado propio. */
export const DEFAULT_PLOTS_LIMIT = 20;

/** Tope de parcelas por página en el listado propio. */
export const MAX_PLOTS_LIMIT = 100;

/**
 * Lista las parcelas del agricultor autenticado.
 *
 * El `farmerId` llega desde el actor (sesión), nunca desde el cuerpo de la
 * petición: por construcción el usuario solo ve sus propias parcelas.
 *
 * El listado es paginado (`limit`/`offset`) para que una finca con muchas
 * parcelas no devuelva una respuesta ilimitada.
 */
export class ListMyPlotsUseCase {
  constructor(private readonly plotRepository: PlotRepository) {}

  async execute(
    actor: PlotActor,
    pagination: PlotPagination = { limit: DEFAULT_PLOTS_LIMIT, offset: 0 },
  ): Promise<Plot[]> {
    // Autorización por rol (capa de aplicación): solo productor o administrador.
    assertPlotWriteRole(actor);

    const limit = pagination.limit;
    const offset = pagination.offset;

    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_PLOTS_LIMIT) {
      throw new DomainError(
        'VALIDATION_ERROR',
        `El límite de parcelas debe ser un entero entre 1 y ${MAX_PLOTS_LIMIT}`,
        422,
      );
    }

    if (!Number.isInteger(offset) || offset < 0) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'El desplazamiento de la paginación debe ser un entero mayor o igual que cero',
        422,
      );
    }

    return this.plotRepository.findByFarmer(actor.id, { limit, offset });
  }
}
