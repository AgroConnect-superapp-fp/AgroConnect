import { Injectable } from '@nestjs/common';
import { PrismaClient } from '../../../../generated/prisma/client';
import { Plot } from '../../domain/entities/Plot';
import type { PlotRepository } from '../../domain/interfaces/PlotRepository';

/** Fila cruda que devuelve Postgres para las consultas SQL de parcelas. */
interface PlotRow {
  id: string;
  name: string;
  area_hectares: number;
  municipality: string;
  department: string;
  farmer_id: string;
  created_at: Date;
}

/**
 * Repositorio de parcelas sobre Prisma + PostGIS.
 *
 * Portado del backend legacy sin cambios de comportamiento: la geometría
 * (`centroid`) se consulta y se escribe SIEMPRE en Postgres (SPEC §12 prohíbe
 * calcular distancias en JS). `save` no escribe `centroid`: lo hace la base de
 * datos (trigger/valor por defecto) a partir de los datos de la parcela.
 *
 * `PrismaClient` se inyecta como alias de `PrismaService` (ver
 * `prisma/prisma.module.ts`), igual que el resto de repositorios portados.
 */
@Injectable()
export class PrismaPlotRepository implements PlotRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Plot | null> {
    const rows = await this.prisma.$queryRaw<PlotRow[]>`
      SELECT id, name, area_hectares, municipality, department, farmer_id, created_at
      FROM plots
      WHERE id = ${id}::uuid
      LIMIT 1
    `;

    const record = rows[0];
    return record ? this.toDomain(record) : null;
  }

  async findNearby(lat: number, lng: number, radiusKm: number): Promise<Plot[]> {
    const records = await this.prisma.$queryRaw<PlotRow[]>`
      SELECT id, name, area_hectares, municipality, department, farmer_id, created_at
      FROM plots
      WHERE ST_DWithin(centroid::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusKm * 1000})
    `;

    return records.map((record) => this.toDomain(record));
  }

  async save(plot: Plot): Promise<Plot> {
    await this.prisma.$executeRaw`
      INSERT INTO plots (id, name, area_hectares, municipality, department, farmer_id)
      VALUES (${plot.id}::uuid, ${plot.name}, ${plot.areaHectares}, ${plot.municipality}, ${plot.department}, ${plot.farmerId}::uuid)
    `;
    return plot;
  }

  private toDomain(record: PlotRow): Plot {
    return new Plot(
      record.id,
      record.name,
      record.area_hectares,
      record.municipality,
      record.department,
      record.farmer_id,
      record.created_at,
    );
  }
}
