import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { buildPrismaDatabaseUrl } from './prisma/databaseUrl';

/**
 * Configuración de Prisma 7 para @agroconnect/api.
 *
 * El esquema es ÚNICO para todo el monorepo: `apps/api/prisma/schema.prisma`
 * es un enlace simbólico al esquema del backend legacy
 * (`apps/api/prisma/schema.prisma`). Así no se duplican modelos y cada
 * aplicación genera su propio cliente en su propio `src/generated`.
 *
 * `prisma generate` NO abre conexión con la base de datos, por eso se usa una
 * URL de reserva cuando DATABASE_URL no está definida (instalaciones en CI).
 * `prisma migrate` sí exige la URL real y recibe `DATABASE_SCHEMA` como
 * `?schema=...` para que CLI y runtime apunten al mismo lugar.
 */
const fallbackUrl = 'postgresql://postgres:postgres@localhost:5432/postgres';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: buildPrismaDatabaseUrl(
      process.env.DATABASE_URL ?? fallbackUrl,
      process.env.DATABASE_SCHEMA,
      fallbackUrl,
    ),
  },
});
