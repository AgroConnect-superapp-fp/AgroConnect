import { Controller, Get, Query } from '@nestjs/common';
import { productsQuerySchema } from '@agroconnect/contracts';
import type { ProductsQuery } from '@agroconnect/contracts';
import { ListProductsUseCase } from '../../application/use-cases/ListProductsUseCase';
import { ZodValidationPipe } from '../../../../shared/http/zod-validation.pipe';
import { success } from '../../../../shared/http/responses';

/**
 * Catálogo público del marketplace (M03).
 *
 * Reemplaza la lectura directa a Supabase/PostgREST del prototipo. La barrera
 * de validación es el contrato Zod compartido; el caso de uso mantiene una
 * segunda validación de los límites por si se invoca desde otro adaptador.
 */
@Controller('products')
export class ProductController {
  constructor(private readonly listProductsUseCase: ListProductsUseCase) {}

  @Get()
  async findAll(
    @Query(new ZodValidationPipe(productsQuerySchema, 'Parámetros de búsqueda inválidos'))
    query: ProductsQuery,
  ): Promise<unknown> {
    const products = await this.listProductsUseCase.execute(query);

    // La entidad de dominio encapsula sus campos en `props`; la API expone un
    // DTO plano para no filtrar detalles de implementación al cliente.
    return success(
      products.map((product) => product.props),
      'Productos del marketplace obtenidos',
    );
  }
}
