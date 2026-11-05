import { DomainError } from '../../../../shared/errors/errors';
import type { Product } from '../../domain/entities/Product';
import type { ProductRepository } from '../../domain/interfaces/ProductRepository';

export interface ModerationListActor {
  id: string;
  role: string;
}

export class ListPendingProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(actor: ModerationListActor): Promise<Product[]> {
    if (actor.role !== 'administrador') {
      throw new DomainError(
        'FORBIDDEN',
        'Solo un administrador puede ver productos pendientes',
        403,
      );
    }

    return this.productRepository.findPending();
  }
}
