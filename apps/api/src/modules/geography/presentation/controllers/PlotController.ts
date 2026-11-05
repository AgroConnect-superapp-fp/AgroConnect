import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { nearbyPlotsQuerySchema } from '@agroconnect/contracts';
import type { NearbyPlotsQuery } from '@agroconnect/contracts';
import { FindNearbyPlotsUseCase } from '../../application/use-cases/FindNearbyPlotsUseCase';
import { ZodValidationPipe } from '../../../../shared/http/zod-validation.pipe';
import { success } from '../../../../shared/http/responses';
import { AuthThrottlerGuard } from '../../../identity/presentation/guards/AuthThrottlerGuard';

/**
 * Controlador de parcelas.
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
 * - El endpoint queda PÚBLICO (sin guard de autenticación), igual que en el
 *   legacy.
 */
@Controller('plots')
export class PlotController {
  constructor(private readonly findNearbyPlotsUseCase: FindNearbyPlotsUseCase) {}

  @Get('nearby')
  @UseGuards(AuthThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async findNearby(
    @Query(new ZodValidationPipe(nearbyPlotsQuerySchema, 'Parámetros de búsqueda inválidos'))
    query: NearbyPlotsQuery,
  ): Promise<unknown> {
    const plots = await this.findNearbyPlotsUseCase.execute(query.lat, query.lng, query.radius);
    const publicPlots = plots.map((plot) => ({
      id: plot.id,
      name: plot.name,
      areaHectares: plot.areaHectares,
      municipality: plot.municipality,
      department: plot.department,
      createdAt: plot.createdAt,
    }));

    return success(publicPlots, 'Búsqueda de parcelas cercanas realizada');
  }
}
