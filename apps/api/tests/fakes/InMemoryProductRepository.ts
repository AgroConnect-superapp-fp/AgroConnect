import { randomUUID } from 'node:crypto';
import { Product } from '../../src/modules/marketplace/domain/entities/Product';
import type {
  NewProductData,
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

  async findById(id: string): Promise<Product | null> {
    return this.products.find((product) => product.id === id) ?? null;
  }

  async create(data: NewProductData): Promise<Product> {
    const product = new Product({
      id: randomUUID(),
      ...data,
    });
    this.products.push(product);
    return product;
  }

  async updateImages(id: string, images: Product['props']['images']): Promise<Product> {
    const index = this.products.findIndex((product) => product.id === id);
    if (index === -1) {
      throw new Error('producto no encontrado');
    }
    const updated = new Product({ ...this.products[index]!.props, images });
    this.products[index] = updated;
    return updated;
  }
}
