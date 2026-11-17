/**
 * Bootstrap de Prisma para los scripts operativos (`create-admin`,
 * `seed-products`).
 *
 * Antes cada script repetía el mismo bloque: abrir un `Pool` de `pg`, crear el
 * `PrismaClient` con el adapter `PrismaPg` y cerrar ambos al terminar. Este
 * helper centraliza ese bloque para que:
 *
 *  - el schema (`DATABASE_SCHEMA`) se aplique siempre igual;
 *  - el cierre de la conexión no dependa de que el script recuerde el orden;
 *  - los scripts no importen `PrismaClient` directamente (queda encapsulado
 *    aquí, el único punto que conoce el cliente generado).
 *
 * No abre la conexión: el `Pool` es lazy, la conexión real se establece en la
 * primera consulta.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../../src/generated/prisma/client';

export interface PrismaContext {
  /** Cliente Prisma listo para usar. */
  readonly prisma: PrismaClient;
  /** Pool de conexiones subyacente (por si el script necesita SQL crudo). */
  readonly pool: Pool;
  /**
   * Cierra el cliente y el pool. Es tolerante a fallos: un error de red al
   * cerrar la conexión no debe convertir un script exitoso en fallido.
   */
  close(): Promise<void>;
}

/**
 * Crea el contexto de Prisma para un script.
 *
 * @param connectionString URL de conexión (normalmente `DATABASE_URL`).
 * @param schema Schema de PostgreSQL donde viven las tablas (`public` por
 * defecto). Se pasa al adapter para que las consultas caigan en el schema
 * correcto, igual que el runtime de la API.
 */
export function createPrismaContext(connectionString: string, schema: string): PrismaContext {
  const pool = new Pool({ connectionString });
  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool, { schema }),
  });

  return {
    prisma,
    pool,
    close: async () => {
      await prisma.$disconnect().catch(() => undefined);
      await pool.end().catch(() => undefined);
    },
  };
}
