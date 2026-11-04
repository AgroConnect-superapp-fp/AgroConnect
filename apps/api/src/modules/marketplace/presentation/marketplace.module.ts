import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '../../../prisma/prisma.module';
import { env } from '../../../shared/config/env';
import { IdentityModule } from '../../identity/presentation/identity.module';
import { PRODUCT_REPOSITORY } from '../application/tokens';
import { ListProductsUseCase } from '../application/use-cases/ListProductsUseCase';
import { PublishProductUseCase } from '../application/use-cases/PublishProductUseCase';
import { UpdateProductImagesUseCase } from '../application/use-cases/UpdateProductImagesUseCase';
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
  imports: [
    PrismaModule,
    IdentityModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: env.RATE_LIMIT_WINDOW_MS,
        limit: env.RATE_LIMIT_MAX_ATTEMPTS,
      },
    ]),
  ],
  controllers: [ProductController],
  providers: [
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
    {
      provide: ListProductsUseCase,
      useFactory: (productRepository: ProductRepository) =>
        new ListProductsUseCase(productRepository),
      inject: [PRODUCT_REPOSITORY],
    },
    {
      provide: PublishProductUseCase,
      useFactory: (productRepository: ProductRepository) =>
        new PublishProductUseCase(productRepository),
      inject: [PRODUCT_REPOSITORY],
    },
    {
      provide: UpdateProductImagesUseCase,
      useFactory: (productRepository: ProductRepository) =>
        new UpdateProductImagesUseCase(productRepository),
      inject: [PRODUCT_REPOSITORY],
    },
  ],
})
export class MarketplaceModule {}
