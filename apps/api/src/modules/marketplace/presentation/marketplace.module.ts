import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { PRODUCT_REPOSITORY } from '../application/tokens';
import { ListProductsUseCase } from '../application/use-cases/ListProductsUseCase';
import { PrismaProductRepository } from '../infrastructure/repositories/PrismaProductRepository';
import { ProductController } from './controllers/ProductController';
import type { ProductRepository } from '../domain/interfaces/ProductRepository';

/**
 * Módulo marketplace (M03).
 *
 * - `domain`: entidad `Product` y puerto `ProductRepository`.
 * - `application`: `ListProductsUseCase` sin decoradores de Nest.
 * - `infrastructure`: Prisma sobre la tabla `products`.
 * - `presentation`: endpoint público `GET /api/v1/products`.
 */
@Module({
  imports: [PrismaModule],
  controllers: [ProductController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
    {
      provide: ListProductsUseCase,
      useFactory: (productRepository: ProductRepository) =>
        new ListProductsUseCase(productRepository),
      inject: [PRODUCT_REPOSITORY],
    },
  ],
})
export class MarketplaceModule {}
