/**
 * Limpia la base de datos de pruebas de AgroConnect.
 *
 * Uso:
 *   npm run test:reset-db -w @agroconnect/api            # simulación
 *   npm run test:reset-db -w @agroconnect/api -- --yes   # ejecuta la limpieza
 *
 * Salvaguardas:
 *   - Solo actúa sobre una base cuyo nombre termina en `_test`.
 *   - Sin `--yes` no borra nada: informa tablas y filas que limpiaría.
 *   - Se niega a ejecutar con `NODE_ENV=production`.
 *   - Conserva la tabla `_prisma_migrations` (historial de migraciones) y
 *     `spatial_ref_sys` (catálogo de sistemas de referencia de PostGIS).
 *   - Re-siembra el catálogo de roles al finalizar, porque las pruebas de
 *     integración registran usuarios y esperan los cinco roles del sistema.
 *   - Nunca imprime la URL de conexión, que puede contener credenciales.
 *
 * La limpieza usa `TRUNCATE ... RESTART IDENTITY CASCADE`, de modo que los
 * identificadores seriales vuelven a empezar y las claves foráneas no exigen
 * un orden manual. Es una operación DESTRUCTIVA: requiere aprobación explícita
 * antes de ejecutarse fuera de este script.
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client';

/**
 * Tablas que nunca se truncan: el historial de migraciones de Prisma y el
 * catálogo de sistemas de referencia de PostGIS (necesario para geography).
 */
const PROTECTED_TABLES = new Set(['_prisma_migrations', 'spatial_ref_sys']);

/** Catálogo de roles sembrado por la migración `20260928041427_init_auth`. */
const SYSTEM_ROLES: ReadonlyArray<readonly [name: string, description: string]> = [
  ['productor', 'Productor agrícola que publica y vende sus cosechas'],
  ['comprador_b2c', 'Comprador persona natural (consumidor final)'],
  ['comprador_b2b', 'Empresa compradora (restaurantes, plazas, distribuidores)'],
  ['transportista', 'Transportador de cosechas entre productor y comprador'],
  ['administrador', 'Administrador de la plataforma'],
];

/**
 * Resuelve la URL de la base de pruebas con el mismo orden que
 * `tests/env.setup.ts`: `TEST_DATABASE_URL` y luego el valor local por defecto.
 * No se usa `DATABASE_URL` para no apuntar por accidente a desarrollo.
 */
function resolveDatabaseUrl(): string {
  return (
    process.env.TEST_DATABASE_URL ??
    'postgresql://agroconnect:agroconnect_dev@localhost:5434/agroconnect_test?schema=public'
  );
}

function databaseName(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\//, '');
  } catch {
    throw new Error('La URL de la base de datos de pruebas no es válida');
  }
}

function databaseSchema(url: string): string {
  try {
    return new URL(url).searchParams.get('schema') ?? 'public';
  } catch {
    throw new Error('La URL de la base de datos de pruebas no es válida');
  }
}

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function listBaseTables(prisma: PrismaClient, schema: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ table_name: string }>>`
    SELECT table_name::text AS table_name
    FROM information_schema.tables
    WHERE table_schema = ${schema}
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;

  return rows.map((row) => row.table_name);
}

async function countRows(prisma: PrismaClient, table: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
    `SELECT COUNT(*) AS total FROM ${quoteIdentifier(table)}`,
  );

  return Number(rows[0]?.total ?? 0);
}

async function truncateTables(prisma: PrismaClient, tables: string[]): Promise<void> {
  const list = tables.map(quoteIdentifier).join(', ');

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

async function seedSystemRoles(prisma: PrismaClient): Promise<void> {
  for (const [name, description] of SYSTEM_ROLES) {
    await prisma.$executeRaw`
      INSERT INTO "roles" ("id", "nombre", "descripcion")
      VALUES (gen_random_uuid(), ${name}, ${description})
    `;
  }
}

async function main(): Promise<void> {
  const url = resolveDatabaseUrl();
  const name = databaseName(url);
  const schema = databaseSchema(url);
  const shouldExecute = process.argv.includes('--yes');

  if (process.env.NODE_ENV === 'production') {
    console.error('Rechazado: NODE_ENV=production nunca limpia una base de datos.');
    process.exitCode = 1;
    return;
  }

  if (!name.endsWith('_test')) {
    console.error(
      `Rechazado: la base "${name}" no termina en _test. ` +
        'Solo se limpia una base de pruebas.',
    );
    process.exitCode = 1;
    return;
  }

  const pool = new Pool({ connectionString: url });
  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool, { schema }),
  });

  try {
    const tables = (await listBaseTables(prisma, schema)).filter(
      (table) => !PROTECTED_TABLES.has(table),
    );

    if (tables.length === 0) {
      console.log(`Base "${name}" (schema ${schema}): no hay tablas para limpiar.`);
      return;
    }

    const counts = await Promise.all(
      tables.map(async (table) => ({ table, rows: await countRows(prisma, table) })),
    );
    const total = counts.reduce((sum, item) => sum + item.rows, 0);

    console.log(`Base "${name}" (schema ${schema})`);
    console.log('─'.repeat(60));

    for (const { table, rows } of counts) {
      console.log(`${table.padEnd(32)} ${String(rows).padStart(8)} filas`);
    }

    console.log('─'.repeat(60));
    console.log(`Tablas: ${tables.length} | Filas: ${total}`);

    if (!shouldExecute) {
      console.log('\nSIMULACIÓN: no se borró nada. Repite con --yes para ejecutar.');
      return;
    }

    await truncateTables(prisma, tables);
    await seedSystemRoles(prisma);

    console.log(`\nLimpieza ejecutada: ${tables.length} tablas truncadas.`);
    console.log(`Roles re-sembrados: ${SYSTEM_ROLES.length}.`);
    console.log('Se conservaron _prisma_migrations y spatial_ref_sys.');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Error desconocido';
  console.error(`Error al limpiar la base de pruebas: ${message}`);
  process.exitCode = 1;
});
