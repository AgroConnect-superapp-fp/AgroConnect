import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/prisma/client';
import { env } from '../shared/config/env';
import { logger } from '../shared/logger/logger';

/**
 * Cliente Prisma 7 con driver adapter `@prisma/adapter-pg`.
 *
 * Réplica exacta de la configuración del backend legacy
 * (`backend/src/shared/infrastructure/prisma.ts`): mismo adapter, mismo schema
 * (`DATABASE_SCHEMA`) y mismos niveles de log.
 *
 * El esquema Prisma es ÚNICO en el monorepo: `apps/api/prisma/schema.prisma`
 * es un enlace simbólico a `backend/prisma/schema.prisma`, y el cliente
 * generado para esta aplicación vive en `apps/api/src/generated/prisma`.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    const pool = new Pool({ connectionString: env.DATABASE_URL });

    super({
      adapter: new PrismaPg(pool, {
        schema: env.DATABASE_SCHEMA,
      }),
      log: ['warn', 'error'],
    });

    this.pool = pool;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    logger.info({ schema: env.DATABASE_SCHEMA }, 'Prisma conectado');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    await this.pool.end();
  }
}
