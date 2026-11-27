import { MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { DocsController } from './docs.controller';
import { OpenApiSource } from './openapi-source';
import { SwaggerAssetsMiddleware } from './swagger-assets.middleware';

/**
 * Módulo de documentación de la API.
 *
 * `DocsModule` es autocontenido: no depende de los módulos de negocio, solo
 * del contrato OpenAPI publicado por `@agroconnect/contracts`.
 */
@Module({
  controllers: [DocsController],
  providers: [OpenApiSource, SwaggerAssetsMiddleware],
})
export class DocsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(SwaggerAssetsMiddleware).forRoutes('docs');
  }
}
