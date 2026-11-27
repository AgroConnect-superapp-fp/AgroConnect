import { DomainError } from '../../../../shared/errors/errors';
import { isPrismaNotFound } from '../../../../shared/infrastructure/prismaErrors';
import type { Product, ProductImage } from '../../domain/entities/Product';
import type { ProductRepository } from '../../domain/interfaces/ProductRepository';
import { sanitizeProductImages } from '../productImages';

export interface ProductImageActor {
  id: string;
  role: string;
}

export class UpdateProductImagesUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly uploadFolder = 'agroconnect/products',
  ) {}

  async execute(
    actor: ProductImageActor,
    productId: string,
    images: ProductImage[],
  ): Promise<Product> {
    if (actor.role !== 'productor' && actor.role !== 'administrador') {
      throw new DomainError(
        'FORBIDDEN',
        'Solo un productor autenticado puede editar imágenes de productos',
        403,
      );
    }

    if (images.length > 6) {
      throw new DomainError('VALIDATION_ERROR', 'Máximo 6 imágenes por producto', 422);
    }

    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new DomainError('NOT_FOUND', 'El producto no existe', 404);
    }

    if (actor.role !== 'administrador' && product.props.producerId !== actor.id) {
      throw new DomainError('FORBIDDEN', 'Solo el propietario puede editar este producto', 403);
    }

    const sanitized = sanitizeProductImages(
      images,
      actor,
      this.uploadFolder,
      new Set(product.props.images.map((image) => image.publicId)),
    );

    try {
      return await this.productRepository.updateImages(
        productId,
        sanitized,
        actor.role === 'administrador' ? undefined : 'pending',
      );
    } catch (error) {
      if (isPrismaNotFound(error)) {
        throw new DomainError('NOT_FOUND', 'El producto no existe', 404);
      }
      throw error;
    }
  }
}
