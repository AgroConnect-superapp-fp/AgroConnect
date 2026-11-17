import { DomainError } from '../../../../shared/errors/errors';
import type { Product } from '../../domain/entities/Product';
import type { ProductRepository } from '../../domain/interfaces/ProductRepository';

export interface ModerationListActor {
  id: string;
  role: string;
}

export interface PendingProductsPagination {
  limit: number;
  offset: number;
}

/**
 * Lista los productos pendientes de moderación.
 *
 * La validación primaria de la query vive en el contrato Zod del controller;
 * este caso de uso repite los límites como defensa en profundidad, igual que
 * `ListProductsUseCase`, y delega la paginación al repositorio.
 */
export class ListPendingProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(
    actor: ModerationListActor,
    pagination: PendingProductsPagination = { limit: 20, offset: 0 },
  ): Promise<Product[]> {
    if (actor.role !== 'administrador') {
      throw new DomainError(
        'FORBIDDEN',
        'Solo un administrador puede ver productos pendientes',
        403,
      );
    }

    const { limit, offset } = pagination;

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new DomainError('VALIDATION_ERROR', 'El límite debe estar entre 1 y 100', 422);
    }

    if (!Number.isInteger(offset) || offset < 0) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'El offset debe ser un entero no negativo',
        422,
      );
    }

    return this.productRepository.findPending(limit, offset);
  }
}
