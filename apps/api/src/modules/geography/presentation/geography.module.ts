import { Module } from '@nestjs/common';
import { PLOT_REPOSITORY } from '../application/tokens';
import { CreatePlotUseCase } from '../application/use-cases/CreatePlotUseCase';
import { DeletePlotUseCase } from '../application/use-cases/DeletePlotUseCase';
import { FindNearbyPlotsUseCase } from '../application/use-cases/FindNearbyPlotsUseCase';
import { GetPlotUseCase } from '../application/use-cases/GetPlotUseCase';
import { ListMyPlotsUseCase } from '../application/use-cases/ListMyPlotsUseCase';
import { UpdatePlotUseCase } from '../application/use-cases/UpdatePlotUseCase';
import { PrismaPlotRepository } from '../infrastructure/repositories/PrismaPlotRepository';
import { PlotController } from './controllers/PlotController';
import { PrismaModule } from '../../../prisma/prisma.module';
import { IdentityModule } from '../../identity/presentation/identity.module';
import { RolesGuard } from '../../identity/presentation/guards/roles.guard';
import type { PlotRepository } from '../domain/interfaces/PlotRepository';

/**
 * Módulo de geografía (parcelas).
 *
 * Estructura hexagonal heredada del backend legacy:
 * - `domain`: entidad `Plot`, value objects de geometría y puerto
 *   `PlotRepository` (sin NestJS).
 * - `application`: casos de uso con el puerto inyectado por token.
 * - `infrastructure`: repositorio Prisma + PostGIS (SQL raw con `ST_DWithin`).
 * - `presentation`: controller (CRUD con sesión + búsqueda pública).
 *
 * Este archivo es el COMPOSITION ROOT del módulo: es el único lugar donde el
 * puerto del dominio se enlaza con su implementación de infraestructura.
 */
@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [PlotController],
  providers: [
    RolesGuard,
    // Puerto del dominio → implementación de infraestructura.
    { provide: PLOT_REPOSITORY, useClass: PrismaPlotRepository },

    // Casos de uso: composition root, sin decoradores de Nest en application.
    {
      provide: FindNearbyPlotsUseCase,
      useFactory: (plotRepository: PlotRepository) => new FindNearbyPlotsUseCase(plotRepository),
      inject: [PLOT_REPOSITORY],
    },
    {
      provide: CreatePlotUseCase,
      useFactory: (plotRepository: PlotRepository) => new CreatePlotUseCase(plotRepository),
      inject: [PLOT_REPOSITORY],
    },
    {
      provide: ListMyPlotsUseCase,
      useFactory: (plotRepository: PlotRepository) => new ListMyPlotsUseCase(plotRepository),
      inject: [PLOT_REPOSITORY],
    },
    {
      provide: GetPlotUseCase,
      useFactory: (plotRepository: PlotRepository) => new GetPlotUseCase(plotRepository),
      inject: [PLOT_REPOSITORY],
    },
    {
      provide: UpdatePlotUseCase,
      useFactory: (plotRepository: PlotRepository) => new UpdatePlotUseCase(plotRepository),
      inject: [PLOT_REPOSITORY],
    },
    {
      provide: DeletePlotUseCase,
      useFactory: (plotRepository: PlotRepository) => new DeletePlotUseCase(plotRepository),
      inject: [PLOT_REPOSITORY],
    },
  ],
})
export class GeographyModule {}
