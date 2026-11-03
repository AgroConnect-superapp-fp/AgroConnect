import type { Product } from '../../src/modules/marketplace/domain/entities/Product';
import type {
  ProductFilters,
  ProductRepository,
} from '../../src/modules/marketplace/domain/interfaces/ProductRepository';

/**
 * Doble de prueba del puerto `ProductRepository`.
 *
 * No implementa filtros: devuelve la lista sembrada y registra los filtros
 * recibidos. Los filtros reales (ILIKE, enums, paginación) se verifican en la
 * prueba de integración contra PostgreSQL.
 */
export class InMemoryProductRepository implements ProductRepository {
  products: Product[] = [];
  lastFilters: ProductFilters | null = null;

  seedProduct(product: Product): void {
    this.products.push(product);
  }

  async findAll(filters: ProductFilters): Promise<Product[]> {
    this.lastFilters = filters;
    return this.products;
  }
}
