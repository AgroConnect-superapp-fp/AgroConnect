import 'dotenv/config';
import { defineConfig } from 'prisma/config';

/**
 * Configuración de Prisma 7 para @agroconnect/api.
 *
 * El esquema es ÚNICO para todo el monorepo: `apps/api/prisma/schema.prisma`
 * es un enlace simbólico al esquema del backend legacy
 * (`backend/prisma/schema.prisma`). Así no se duplican modelos y cada
 * aplicación genera su propio cliente en su propio `src/generated`.
 *
 * `prisma generate` NO abre conexión con la base de datos, por eso se usa una
 * URL de reserva cuando DATABASE_URL no está definida (instalaciones en CI).
 * `prisma migrate` sí exige la URL real.
 */
const fallbackUrl = 'postgresql://postgres:postgres@localhost:5432/postgres';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? fallbackUrl,
  },
});
