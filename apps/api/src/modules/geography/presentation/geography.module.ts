import { Module } from '@nestjs/common';
import { PLOT_REPOSITORY } from '../application/tokens';
import { FindNearbyPlotsUseCase } from '../application/use-cases/FindNearbyPlotsUseCase';
import { PrismaPlotRepository } from '../infrastructure/repositories/PrismaPlotRepository';
import { PlotController } from './controllers/PlotController';
import { PrismaModule } from '../../../prisma/prisma.module';
import type { PlotRepository } from '../domain/interfaces/PlotRepository';

/**
 * Módulo de geografía (parcelas).
 *
 * Estructura hexagonal heredada del backend legacy:
 * - `domain`: entidad `Plot` y puerto `PlotRepository` (sin NestJS).
 * - `application`: caso de uso con el puerto inyectado por token.
 * - `infrastructure`: repositorio Prisma + PostGIS (SQL raw con `ST_DWithin`).
 * - `presentation`: controller público (sin guard de autenticación).
 */
@Module({
  imports: [PrismaModule],
  controllers: [PlotController],
  providers: [
    // Puerto del dominio → implementación de infraestructura.
    { provide: PLOT_REPOSITORY, useClass: PrismaPlotRepository },

    // Caso de uso: composition root, sin decoradores de Nest en application.
    {
      provide: FindNearbyPlotsUseCase,
      useFactory: (plotRepository: PlotRepository) =>
        new FindNearbyPlotsUseCase(plotRepository),
      inject: [PLOT_REPOSITORY],
    },
  ],
})
export class GeographyModule {}
