import {
  Body,
  Controller,
  Delete,
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
  createPlotSchema,
  listMyPlotsQuerySchema,
  nearbyPlotsQuerySchema,
  updatePlotSchema,
} from '@agroconnect/contracts';
import type {
  CreatePlotInput,
  ListMyPlotsQuery,
  NearbyPlotsQuery,
  UpdatePlotInput,
} from '@agroconnect/contracts';
import { CreatePlotUseCase } from '../../application/use-cases/CreatePlotUseCase';
import { DeletePlotUseCase } from '../../application/use-cases/DeletePlotUseCase';
import { FindNearbyPlotsUseCase } from '../../application/use-cases/FindNearbyPlotsUseCase';
import { GetPlotUseCase } from '../../application/use-cases/GetPlotUseCase';
import { ListMyPlotsUseCase } from '../../application/use-cases/ListMyPlotsUseCase';
import { UpdatePlotUseCase } from '../../application/use-cases/UpdatePlotUseCase';
import { ZodValidationPipe } from '../../../../shared/http/zod-validation.pipe';
import { success } from '../../../../shared/http/responses';
import type { AuthenticatedRequest } from '../../../../shared/http/authenticated-user';
import { SessionAuthGuard } from '../../../identity/presentation/guards/SessionAuthGuard';
import { AuthThrottlerGuard } from '../../../identity/presentation/guards/AuthThrottlerGuard';
import { Roles } from '../../../identity/presentation/guards/roles.decorator';
import { RolesGuard } from '../../../identity/presentation/guards/roles.guard';
import { toNearbyPlotResponse, toPlotResponse } from '../dto/plot-response.mapper';

/**
 * Controlador de parcelas (M02 — geografía).
 *
 * Portado del backend legacy (`backend/src/modules/geography/presentation`):
 * misma ruta `GET /api/v1/plots/nearby` y mismo sobre `{ success, data }`.
 *
 * Diferencias intencionadas frente al legacy:
 * - La validación de la query vive en el contrato compartido
 *   (`nearbyPlotsQuerySchema`, ADR-015) aplicado con `ZodValidationPipe`; el
 *   legacy parseaba con `parseFloat` dentro del controller.
 * - Los errores ya no se capturan aquí: el filtro global
 *   (`AllExceptionsFilter`) los traduce al cuerpo de error estándar.
 * - El endpoint de proximidad queda PÚBLICO (sin guard de autenticación),
 *   igual que en el legacy.
 *
 * El CRUD de parcelas (alta, consulta, edición y baja) sí exige sesión: el
 * `farmerId` se toma SIEMPRE del usuario autenticado y NUNCA del cuerpo de la
 * petición, de modo que un agricultor no puede registrar ni modificar
 * parcelas a nombre de otro.
 *
 * AUTORIZACIÓN POR ROL: gestionar parcelas (alta, edición, baja y listado
 * propio) es una operación de productor. El `RolesGuard` rechaza temprano
 * (403) a compradores y transportistas, y la validación autoritativa vive en
 * los casos de uso (`assertPlotWriteRole`), que es la capa que protege el
 * dominio aunque el caso de uso se invoque por otro adaptador.
 *
 * La protección CSRF es global (`CsrfGuard` registrado como `APP_GUARD` en
 * `app.module.ts`); por eso el controller no la aplica de forma local, igual
 * que `ProductController`.
 */
@Controller('plots')
export class PlotController {
  constructor(
    private readonly createPlotUseCase: CreatePlotUseCase,
    private readonly listMyPlotsUseCase: ListMyPlotsUseCase,
    private readonly getPlotUseCase: GetPlotUseCase,
    private readonly updatePlotUseCase: UpdatePlotUseCase,
    private readonly deletePlotUseCase: DeletePlotUseCase,
    private readonly findNearbyPlotsUseCase: FindNearbyPlotsUseCase,
  ) {}

  /**
   * Búsqueda de parcelas cercanas (PÚBLICA).
   *
   * Se declara ANTES que `:id` porque NestJS resuelve las rutas en orden de
   * declaración: si `:id` fuera primero, capturaría el literal `nearby`.
   *
   * La respuesta es una proyección pública (sin `farmerId`, `boundary` ni
   * `centroid`) e incluye `distanceKm`, que PostGIS ya calcula con
   * `ST_Distance`: es el dato principal para un comprador.
   */
  @Get('nearby')
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async findNearby(
    @Query(new ZodValidationPipe(nearbyPlotsQuerySchema, 'Parámetros de búsqueda inválidos'))
    query: NearbyPlotsQuery,
  ): Promise<unknown> {
    const plots = await this.findNearbyPlotsUseCase.execute(query.lat, query.lng, query.radius);

    return success(
      plots.map((plot) => toNearbyPlotResponse(plot)),
      'Búsqueda de parcelas cercanas realizada',
    );
  }

  /** Lista paginada de las parcelas del agricultor autenticado. */
  @Get()
  @UseGuards(SessionAuthGuard, RolesGuard, AuthThrottlerGuard)
  @Roles('productor', 'administrador')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query(new ZodValidationPipe(listMyPlotsQuerySchema, 'Parámetros de paginación inválidos'))
    query: ListMyPlotsQuery,
  ): Promise<unknown> {
    const user = request.user!;
    const plots = await this.listMyPlotsUseCase.execute(
      { id: user.id, role: user.role },
      { limit: query.limit, offset: query.offset },
    );

    return success(
      plots.map((plot) => toPlotResponse(plot)),
      'Parcelas del agricultor obtenidas',
    );
  }

  /** Registra una parcela con su geometría. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(SessionAuthGuard, RolesGuard, AuthThrottlerGuard)
  @Roles('productor', 'administrador')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async create(
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createPlotSchema, 'Datos de la parcela inválidos'))
    body: CreatePlotInput,
  ): Promise<unknown> {
    const user = request.user!;
    const plot = await this.createPlotUseCase.execute(
      { id: user.id, role: user.role },
      {
        name: body.name,
        municipality: body.municipality,
        department: body.department,
        boundary: body.boundary,
      },
    );

    return success(toPlotResponse(plot), 'Parcela registrada correctamente');
  }

  /** Detalle de una parcela propia. */
  @Get(':id')
  @UseGuards(SessionAuthGuard, AuthThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<unknown> {
    const user = request.user!;
    const plot = await this.getPlotUseCase.execute(user.id, id);

    return success(toPlotResponse(plot), 'Parcela obtenida correctamente');
  }

  /** Actualización parcial de una parcela propia. */
  @Patch(':id')
  @UseGuards(SessionAuthGuard, RolesGuard, AuthThrottlerGuard)
  @Roles('productor', 'administrador')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async update(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(updatePlotSchema, 'Datos de actualización inválidos'))
    body: UpdatePlotInput,
  ): Promise<unknown> {
    const user = request.user!;
    const plot = await this.updatePlotUseCase.execute(
      { id: user.id, role: user.role },
      id,
      {
        name: body.name,
        municipality: body.municipality,
        department: body.department,
        boundary: body.boundary,
      },
    );

    return success(toPlotResponse(plot), 'Parcela actualizada correctamente');
  }

  /** Baja lógica (soft delete) de una parcela propia. */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(SessionAuthGuard, RolesGuard, AuthThrottlerGuard)
  @Roles('productor', 'administrador')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<void> {
    const user = request.user!;
    await this.deletePlotUseCase.execute({ id: user.id, role: user.role }, id);
  }
}
