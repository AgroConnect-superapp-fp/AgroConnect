import { DomainError } from '../../../../shared/errors/errors';
import type { Product } from '../../domain/entities/Product';
import type { ProductFilters, ProductRepository } from '../../domain/interfaces/ProductRepository';

/**
 * Lista los productos del marketplace.
 *
 * La validación primaria vive en el contrato Zod del controller. Este caso de
 * uso repite los límites esenciales como defensa en profundidad y normaliza la
 * búsqueda para que los wildcards de SQL (`%`, `_`) no alteren la consulta.
 */
export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(filters: ProductFilters): Promise<Product[]> {
    if (filters.limit < 1 || filters.limit > 100) {
      throw new DomainError('VALIDATION_ERROR', 'El límite debe estar entre 1 y 100', 400);
    }

    if (filters.offset < 0) {
      throw new DomainError('VALIDATION_ERROR', 'El offset no puede ser negativo', 400);
    }

    return this.productRepository.findAll({
      ...filters,
      search: this.normalizeSearch(filters.search),
    });
  }

  private normalizeSearch(value: string | undefined): string | undefined {
    if (!value) return undefined;

    const normalized = value
      .trim()
      .replace(/[%_,()'"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);

    return normalized.length > 0 ? normalized : undefined;
  }
}
