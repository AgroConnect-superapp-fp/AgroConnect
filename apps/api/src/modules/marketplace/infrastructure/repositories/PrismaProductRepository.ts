import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '../../../../generated/prisma/client';
import { Product } from '../../domain/entities/Product';
import type { ProductFilters, ProductRepository } from '../../domain/interfaces/ProductRepository';
import type { ProductImage } from '../../domain/entities/Product';

/**
 * Repositorio de productos del marketplace sobre Prisma.
 *
 * La lectura es pública y solo devuelve datos aprobados. La escritura llegará
 * en el siguiente incremento, cuando el productor autenticado publique un
 * producto; por eso aquí solo se implementa `findAll`.
 */
@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(filters: ProductFilters): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { owner: { contains: filters.search, mode: 'insensitive' } },
        { municipality: { contains: filters.search, mode: 'insensitive' } },
        { department: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.crop) {
      where.crop = filters.crop;
    }
    if (filters.department) {
      where.department = { equals: filters.department, mode: 'insensitive' };
    }
    if (filters.municipality) {
      where.municipality = { equals: filters.municipality, mode: 'insensitive' };
    }
    if (filters.certification) {
      where.certification = filters.certification;
    }

    const rows = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: filters.offset,
      take: filters.limit,
    });

    return rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: {
    id: string;
    name: string;
    owner: string;
    description: string | null;
    contact: string | null;
    department: string;
    municipality: string;
    crop: string;
    areaHectares: number;
    productivity: number;
    certification: string | null;
    lat: number;
    lng: number;
    images: unknown;
    coordinates: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): Product {
    return new Product({
      id: row.id,
      name: row.name,
      owner: row.owner,
      description: row.description ?? undefined,
      contact: row.contact ?? undefined,
      department: row.department,
      municipality: row.municipality,
      crop: row.crop as Product['props']['crop'],
      area: row.areaHectares,
      productivity: row.productivity,
      certification: (row.certification ?? undefined) as Product['props']['certification'],
      lat: row.lat,
      lng: row.lng,
      images: normalizeImages(row.images),
      coordinates: normalizeCoordinates(row.coordinates),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}

function normalizeImages(value: unknown): ProductImage[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const candidate = item as Record<string, unknown>;
    if (typeof candidate['publicId'] !== 'string' || candidate['publicId'].length === 0) {
      return [];
    }

    const image: ProductImage = { publicId: candidate['publicId'] };
    if (typeof candidate['url'] === 'string') image.url = candidate['url'];
    if (typeof candidate['alt'] === 'string') image.alt = candidate['alt'];
    if (typeof candidate['width'] === 'number') image.width = candidate['width'];
    if (typeof candidate['height'] === 'number') image.height = candidate['height'];
    if (typeof candidate['bytes'] === 'number') image.bytes = candidate['bytes'];
    if (typeof candidate['uploadedAt'] === 'string') image.uploadedAt = candidate['uploadedAt'];
    if (
      candidate['moderationStatus'] === 'pending' ||
      candidate['moderationStatus'] === 'approved' ||
      candidate['moderationStatus'] === 'rejected'
    ) {
      image.moderationStatus = candidate['moderationStatus'];
    }
    if (typeof candidate['lqip'] === 'string') image.lqip = candidate['lqip'];

    return [image];
  });
}

function normalizeCoordinates(value: unknown): [number, number][] {
  if (!Array.isArray(value)) return [];

  return value.filter((point): point is [number, number] => {
    return (
      Array.isArray(point) &&
      point.length === 2 &&
      typeof point[0] === 'number' &&
      typeof point[1] === 'number'
    );
  });
}
