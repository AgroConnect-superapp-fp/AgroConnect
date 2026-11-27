import type {
  Product,
  ProductCertification,
  ProductCrop,
  ProductImage,
  ProductModerationStatus,
} from '../entities/Product';

/**
 * Filtros de lectura del marketplace.
 *
 * `limit` y `offset` son obligatorios para que el repositorio no dependa de
 * valores por defecto de Prisma; el contrato y el caso de uso los normalizan.
 */
export interface ProductFilters {
  search?: string;
  crop?: ProductCrop;
  department?: string;
  municipality?: string;
  certification?: ProductCertification;
  limit: number;
  offset: number;
}

export interface NewProductData {
  name: string;
  owner: string;
  description?: string;
  contact?: string;
  department: string;
  municipality: string;
  crop: ProductCrop;
  area: number;
  productivity: number;
  certification?: ProductCertification;
  lat: number;
  lng: number;
  producerId: string;
  images: ProductImage[];
  coordinates: [number, number][];
}

export interface ProductRepository {
  findAll(filters: ProductFilters): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  findPending(limit?: number, offset?: number): Promise<Product[]>;
  create(data: NewProductData): Promise<Product>;
  updateImages(
    id: string,
    images: ProductImage[],
    moderationStatus?: ProductModerationStatus,
  ): Promise<Product>;
  updateModerationStatus(id: string, status: ProductModerationStatus): Promise<Product>;
}
