import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Evidencia de H10: catálogo de restricciones y pruebas negativas del esquema
 * MVP. No sustituye las pruebas del modelo comercial (H07–H09); documenta que
 * las restricciones actuales existen y que el motor las hace cumplir.
 */
describe('Data constraints (e2e)', () => {
  let app: NestExpressApplication;
  let server: Server;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();
    server = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('expone el catálogo esperado de PK, FK y CHECK', async () => {
    const rows = await prisma.$queryRaw<Array<{ contype: string; total: bigint }>>`
      SELECT contype::text, count(*)::bigint AS total
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      GROUP BY contype
    `;
    const counts = Object.fromEntries(rows.map((row) => [row.contype, Number(row.total)]));

    expect(counts['p']).toBeGreaterThanOrEqual(13);
    expect(counts['f']).toBeGreaterThanOrEqual(9);
    expect(counts['c']).toBeGreaterThanOrEqual(6);

    const indexes = await prisma.$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
    `;
    const names = indexes.map((item) => item.indexname);
    expect(names).toEqual(
      expect.arrayContaining([
        'users_correo_key',
        'users_documento_key',
        'users_celular_key',
        'products_moderation_status_idx',
        'plots_farmer_id_idx',
        'audit_events_pkey',
      ]),
    );
  });

  it('rechaza un correo duplicado en users', async () => {
    const email = `constraint.${randomUUID()}@example.com`;
    const role = await prisma.role.findUniqueOrThrow({ where: { name: 'productor' } });
    const base = {
      fullName: 'Prueba Constraint',
      document: `C${Date.now()}`.slice(0, 12),
      email,
      phone: `31${Date.now()}`.slice(0, 10),
      passwordHash: 'hash',
      roleId: role.id,
      acceptsDataProcessing: true,
      emailVerifiedAt: new Date(),
    };

    const created = await prisma.user.create({ data: base });
    await expect(
      prisma.user.create({
        data: {
          ...base,
          document: `D${Date.now()}`.slice(0, 12),
          phone: `32${Date.now()}`.slice(0, 10),
        },
      }),
    ).rejects.toMatchObject({ code: 'P2002' });

    await prisma.user.delete({ where: { id: created.id } });
  });

  it('rechaza una FK de rol inexistente', async () => {
    await expect(
      prisma.user.create({
        data: {
          fullName: 'FK Inválida',
          document: `F${Date.now()}`.slice(0, 12),
          email: `fk.${randomUUID()}@example.com`,
          phone: `33${Date.now()}`.slice(0, 10),
          passwordHash: 'hash',
          roleId: randomUUID(),
          acceptsDataProcessing: true,
        },
      }),
    ).rejects.toMatchObject({ code: 'P2003' });
  });

  it('protege audit_events contra mutaciones', async () => {
    const event = await prisma.auditEvent.create({
      data: {
        actorRole: 'test',
        action: 'test.constraint',
        entityType: 'test',
        entityId: randomUUID(),
      },
    });

    await expect(
      prisma.auditEvent.update({ where: { id: event.id }, data: { action: 'mutado' } }),
    ).rejects.toThrow(/append-only/);
    await expect(prisma.auditEvent.delete({ where: { id: event.id } })).rejects.toThrow(
      /append-only/,
    );
  });
});
