import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  productsQuerySchema,
  publishProductSchema,
  updateProductImagesSchema,
  updateProductModerationSchema,
} from '@agroconnect/contracts';
import type {
  ProductsQuery,
  PublishProductInput,
  UpdateProductImagesInput,
  UpdateProductModerationInput,
} from '@agroconnect/contracts';
import { ListProductsUseCase } from '../../application/use-cases/ListProductsUseCase';
import { PublishProductUseCase } from '../../application/use-cases/PublishProductUseCase';
import { UpdateProductImagesUseCase } from '../../application/use-cases/UpdateProductImagesUseCase';
import { ModerateProductUseCase } from '../../application/use-cases/ModerateProductUseCase';
import { ListPendingProductsUseCase } from '../../application/use-cases/ListPendingProductsUseCase';
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
    private readonly updateProductImagesUseCase: UpdateProductImagesUseCase,
    private readonly moderateProductUseCase: ModerateProductUseCase,
    private readonly listPendingProductsUseCase: ListPendingProductsUseCase,
  ) {}

  @Get()
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async findAll(
    @Query(new ZodValidationPipe(productsQuerySchema, 'Parámetros de búsqueda inválidos'))
    query: ProductsQuery,
  ): Promise<unknown> {
    const products = await this.listProductsUseCase.execute(query);

    // La entidad de dominio encapsula sus campos en `props`; la API expone un
    // DTO plano para no filtrar detalles de implementación al cliente.
    const publicProducts = products.map((product) => {
      const publicProps = { ...product.props };
      // El UUID del productor es un identificador interno; no se publica.
      delete publicProps.producerId;
      return publicProps;
    });

    return success(publicProducts, 'Productos del marketplace obtenidos');
  }

  @Get('pending')
  @UseGuards(SessionAuthGuard, AuthThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async findPending(@Req() request: AuthenticatedRequest): Promise<unknown> {
    const user = request.user!;
    const products = await this.listPendingProductsUseCase.execute({
      id: user.id,
      role: user.role,
    });

    return success(
      products.map((product) => product.props),
      'Productos pendientes de moderación',
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

  @Patch(':id/moderation')
  @UseGuards(SessionAuthGuard, AuthThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async moderate(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(updateProductModerationSchema, 'Estado de moderación inválido'))
    body: UpdateProductModerationInput,
  ): Promise<unknown> {
    const user = request.user!;
    const product = await this.moderateProductUseCase.execute(
      { id: user.id, role: user.role },
      id,
      body.status,
    );

    return success(
      product.props,
      `Producto ${body.status === 'approved' ? 'aprobado' : 'rechazado'}`,
    );
  }

  @Patch(':id')
  @UseGuards(SessionAuthGuard, AuthThrottlerGuard)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async updateImages(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(updateProductImagesSchema, 'Datos de imágenes inválidos'))
    body: UpdateProductImagesInput,
  ): Promise<unknown> {
    const user = request.user!;
    const product = await this.updateProductImagesUseCase.execute(
      { id: user.id, role: user.role },
      id,
      body.images,
    );

    return success(product.props, 'Imágenes del producto actualizadas');
  }
}
