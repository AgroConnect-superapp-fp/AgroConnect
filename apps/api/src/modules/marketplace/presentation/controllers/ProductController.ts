import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { productsQuerySchema, publishProductSchema } from '@agroconnect/contracts';
import type { ProductsQuery, PublishProductInput } from '@agroconnect/contracts';
import { ListProductsUseCase } from '../../application/use-cases/ListProductsUseCase';
import { PublishProductUseCase } from '../../application/use-cases/PublishProductUseCase';
import { ZodValidationPipe } from '../../../../shared/http/zod-validation.pipe';
import { success } from '../../../../shared/http/responses';
import type { AuthenticatedRequest } from '../../../../shared/http/authenticated-user';
import { SessionAuthGuard } from '../../../identity/presentation/guards/SessionAuthGuard';
import { AuthThrottlerGuard } from '../../../identity/presentation/guards/AuthThrottlerGuard';

/**
 * Catálogo público del marketplace (M03).
 *
 * Reemplaza la lectura directa a Supabase/PostgREST del prototipo. La barrera
 * de validación es el contrato Zod compartido; el caso de uso mantiene una
 * segunda validación de los límites por si se invoca desde otro adaptador.
 */
@Controller('products')
export class ProductController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly publishProductUseCase: PublishProductUseCase,
  ) {}

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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(SessionAuthGuard, AuthThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(publishProductSchema, 'Datos del producto inválidos'))
    body: PublishProductInput,
  ): Promise<unknown> {
    // El guard garantiza la sesión; esta comprobación es defensa de tipos.
    if (!request.user) {
      throw new Error('La petición llegó al controller sin usuario autenticado');
    }

    const product = await this.publishProductUseCase.execute(request.user, body);

    return success(product.props, 'Producto publicado correctamente');
  }
}
