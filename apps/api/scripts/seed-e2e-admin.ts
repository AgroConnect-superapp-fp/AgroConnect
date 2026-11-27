/**
 * Fixture idempotente de administrador para la suite E2E.
 *
 * Solo se usa contra la base `_test` (validada en `global-setup.ts`). A
 * diferencia de `create:admin`, no aborta si la cuenta ya existe: restablece
 * la contraseña y el estado para que cada corrida sea reproducible. No imprime
 * la contraseña.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createPrismaContext } from './lib/prisma';
import { hashPassword } from './lib/password';

const databaseUrl = process.env.DATABASE_URL;
const schema = process.env.DATABASE_SCHEMA ?? 'public';
const email = (process.env.E2E_ADMIN_EMAIL ?? 'admin.e2e@agroconnect.local').toLowerCase();
const password = process.env.E2E_ADMIN_PASSWORD ?? 'E2eAdmin2026';
const fullName = process.env.E2E_ADMIN_NAME ?? 'Administradora E2E';
const document = 'E2E-ADMIN-001';
const phone = '3009999999';

async function main(): Promise<void> {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL es obligatoria para sembrar el administrador E2E.');
  }

  const context = createPrismaContext(databaseUrl, schema);
  const { prisma } = context;

  try {
    const role = await prisma.role.findUnique({ where: { name: 'administrador' } });
    if (!role) {
      throw new Error('No existe el rol administrador. Ejecuta las migraciones/seed de roles.');
    }

    const passwordHash = await hashPassword(password);
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { document }, { phone }] },
      select: { id: true },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          fullName,
          document,
          email,
          phone,
          passwordHash,
          roleId: role.id,
          status: 'ACTIVO',
          acceptsDataProcessing: true,
          emailVerifiedAt: new Date(),
        },
      });
      console.log(`Administrador E2E actualizado: ${email}`);
      return;
    }

    await prisma.user.create({
      data: {
        id: randomUUID(),
        fullName,
        document,
        email,
        phone,
        passwordHash,
        roleId: role.id,
        status: 'ACTIVO',
        acceptsDataProcessing: true,
        emailVerifiedAt: new Date(),
      },
    });
    console.log(`Administrador E2E creado: ${email}`);
  } finally {
    await context.close();
  }
}

main().catch((error: unknown) => {
  console.error(
    'No fue posible sembrar el administrador E2E:',
    error instanceof Error ? error.message : String(error)
  );
  process.exitCode = 1;
});
