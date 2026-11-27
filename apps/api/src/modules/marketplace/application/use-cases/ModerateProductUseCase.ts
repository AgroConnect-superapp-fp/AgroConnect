import { DomainError } from '../../../../shared/errors/errors';
import type { Product, ProductModerationStatus } from '../../domain/entities/Product';
import type { ProductRepository } from '../../domain/interfaces/ProductRepository';

export interface ModerationActor {
  id: string;
  role: string;
}

export class ModerateProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(
    actor: ModerationActor,
    productId: string,
    status: Exclude<ProductModerationStatus, 'pending'>,
  ): Promise<Product> {
    if (actor.role !== 'administrador') {
      throw new DomainError('FORBIDDEN', 'Solo un administrador puede moderar productos', 403);
    }

    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new DomainError('NOT_FOUND', 'El producto no existe', 404);
    }

    return this.productRepository.updateModerationStatus(productId, status);
  }
}
