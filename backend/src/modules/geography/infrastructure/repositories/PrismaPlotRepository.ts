import { PlotRepository } from '../../domain/interfaces/PlotRepository';
import { Plot } from '../../domain/entities/Plot';
import { PrismaClient } from '../../../../generated/prisma/client';

interface PlotRow {
  id: string;
  name: string;
  area_hectares: number;
  municipality: string;
  department: string;
  farmer_id: string;
  created_at: Date;
}

export class PrismaPlotRepository implements PlotRepository {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

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
