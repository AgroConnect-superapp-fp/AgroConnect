/**
 * Provisiona una cuenta administradora verificada.
 *
 * Uso:
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME=... \
 *   ADMIN_DOCUMENT=... ADMIN_PHONE=... \
 *   DATABASE_URL=... DATABASE_SCHEMA=agroconnect \
 *     npm run create:admin -w @agroconnect/api
 *
 * No se ejecuta automáticamente y no imprime la contraseña. Si el correo,
 * documento o celular ya existen, aborta para no sobrescribir cuentas.
 */
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { env } from '../src/shared/config/env';
import { Argon2PasswordHasher } from '../src/modules/identity/infrastructure/services/Argon2PasswordHasher';
import { Password } from '../src/modules/identity/domain/value-objects/Password';

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME?.trim() || 'Administrador AgroConnect';
  const document = process.env.ADMIN_DOCUMENT?.trim();
  const phone = process.env.ADMIN_PHONE?.trim();

  if (!email || !password || !document || !phone) {
    throw new Error(
      'Define ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_DOCUMENT y ADMIN_PHONE para crear el administrador.',
    );
  }

  const validatedPassword = Password.create(password);
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const prisma = new PrismaClient({
    adapter: new PrismaPg(pool, { schema: env.DATABASE_SCHEMA }),
  });

  try {
    const role = await prisma.role.findUnique({ where: { name: 'administrador' } });
    if (!role) {
      throw new Error('No existe el rol administrador. Ejecuta las migraciones/seed de roles.');
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { document }, { phone }] },
      select: { id: true },
    });
    if (existing) {
      throw new Error('Ya existe una cuenta con ese correo, documento o celular.');
    }

    const passwordHash = await new Argon2PasswordHasher().hash(validatedPassword.value);
    const user = await prisma.user.create({
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
      select: { id: true, email: true, fullName: true },
    });

    console.log('Administrador creado correctamente.');
    console.log(`  id: ${user.id}`);
    console.log(`  correo: ${user.email}`);
    console.log(`  nombre: ${user.fullName}`);
  } finally {
    await prisma.$disconnect().catch(() => undefined);
    await pool.end().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(
    'No fue posible crear el administrador:',
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
});
