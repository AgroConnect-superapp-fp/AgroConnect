import { Controller, Get, Query } from '@nestjs/common';
import { nearbyPlotsQuerySchema } from '@agroconnect/contracts';
import type { NearbyPlotsQuery } from '@agroconnect/contracts';
import { FindNearbyPlotsUseCase } from '../../application/use-cases/FindNearbyPlotsUseCase';
import { ZodValidationPipe } from '../../../../shared/http/zod-validation.pipe';
import { success } from '../../../../shared/http/responses';

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
  async findNearby(
    @Query(new ZodValidationPipe(nearbyPlotsQuerySchema, 'Parámetros de búsqueda inválidos'))
    query: NearbyPlotsQuery,
  ): Promise<unknown> {
    const plots = await this.findNearbyPlotsUseCase.execute(query.lat, query.lng, query.radius);

    return success(plots, 'Búsqueda de parcelas cercanas realizada');
  }
}
