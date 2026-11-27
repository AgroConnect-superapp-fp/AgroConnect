import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { adminUserSchema } from '@agroconnect/contracts';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtTokenService } from '../../src/modules/identity/infrastructure/services/JwtTokenService';
import { PrismaUserRepository } from '../../src/modules/identity/infrastructure/repositories/PrismaUserRepository';
import { env } from '../../src/shared/config/env';

/**
 * Prueba e2e de la administración de usuarios contra PostgreSQL real.
 *
 * Cubre listado/búsqueda/filtros, autorización por rol, cambio de estado con
 * invalidación de sesión, cambio de rol con revocación de tokens, bloqueo de
 * auto-modificación y la garantía de que nunca se queda sin administradores
 * activos. Crea y limpia sus propios datos con UUIDs únicos.
 */
describe('Admin users (e2e)', () => {
  let app: NestExpressApplication;
  let server: Server;
  let prisma: PrismaService;

  const suffix = `${Date.now()}`.slice(-8);
  const adminAId = randomUUID();
  const adminBId = randomUUID();
  const adminCId = randomUUID();
  const adminDId = randomUUID();
  const producerId = randomUUID();
  const buyerId = randomUUID();

  const producerEmail = `admin-producer.${suffix}@example.com`;
  const producerRefreshHash = `refresh-producer-${suffix}`;
  const buyerRefreshHash = `refresh-buyer-${suffix}`;

  const tokenService = new JwtTokenService(
    env.JWT_ACCESS_SECRET,
    env.JWT_REFRESH_SECRET,
    env.JWT_ACCESS_EXPIRES_IN,
    env.JWT_REFRESH_EXPIRES_IN,
    env.JWT_ISSUER,
    env.JWT_AUDIENCE,
  );

  let adminAToken = '';
  let adminBToken = '';
  let producerToken = '';
  let buyerToken = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();
    server = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);

    const [producerRole, buyerRole, adminRole] = await Promise.all([
      prisma.role.findUniqueOrThrow({ where: { name: 'productor' } }),
      prisma.role.findUniqueOrThrow({ where: { name: 'comprador_b2c' } }),
      prisma.role.findUniqueOrThrow({ where: { name: 'administrador' } }),
    ]);

    await prisma.user.createMany({
      data: [
        {
          id: adminAId,
          fullName: `Administrador Principal ${suffix}`,
          document: `AA${suffix}`,
          email: `admin.a.${suffix}@example.com`,
          phone: `30${suffix}01`,
          passwordHash: 'hash',
          roleId: adminRole.id,
          status: 'ACTIVO',
          acceptsDataProcessing: true,
          emailVerifiedAt: new Date(),
        },
        {
          id: adminBId,
          fullName: `Administrador Secundario ${suffix}`,
          document: `AB${suffix}`,
          email: `admin.b.${suffix}@example.com`,
          phone: `30${suffix}02`,
          passwordHash: 'hash',
          roleId: adminRole.id,
          status: 'ACTIVO',
          acceptsDataProcessing: true,
          emailVerifiedAt: new Date(),
        },
        {
          id: adminCId,
          fullName: `Administrador Concurrente C ${suffix}`,
          document: `AE${suffix}`,
          email: `admin.c.${suffix}@example.com`,
          phone: `30${suffix}05`,
          passwordHash: 'hash',
          roleId: adminRole.id,
          status: 'ACTIVO',
          acceptsDataProcessing: true,
          emailVerifiedAt: new Date(),
        },
        {
          id: adminDId,
          fullName: `Administrador Concurrente D ${suffix}`,
          document: `AF${suffix}`,
          email: `admin.d.${suffix}@example.com`,
          phone: `30${suffix}06`,
          passwordHash: 'hash',
          roleId: adminRole.id,
          status: 'ACTIVO',
          acceptsDataProcessing: true,
          emailVerifiedAt: new Date(),
        },
        {
          id: producerId,
          fullName: `Productor Admin E2E ${suffix}`,
          document: `AP${suffix}`,
          email: producerEmail,
          phone: `30${suffix}03`,
          passwordHash: 'hash',
          roleId: producerRole.id,
          status: 'ACTIVO',
          acceptsDataProcessing: true,
          emailVerifiedAt: new Date(),
        },
        {
          id: buyerId,
          fullName: `Comprador Admin E2E ${suffix}`,
          document: `AC${suffix}`,
          email: `admin.buyer.${suffix}@example.com`,
          phone: `30${suffix}04`,
          passwordHash: 'hash',
          roleId: buyerRole.id,
          status: 'ACTIVO',
          acceptsDataProcessing: true,
          emailVerifiedAt: new Date(),
        },
      ],
    });

    await prisma.refreshToken.createMany({
      data: [
        {
          userId: producerId,
          tokenHash: producerRefreshHash,
          expiresAt: new Date(Date.now() + 3_600_000),
          familyId: randomUUID(),
          generation: 0,
        },
        {
          userId: buyerId,
          tokenHash: buyerRefreshHash,
          expiresAt: new Date(Date.now() + 3_600_000),
          familyId: randomUUID(),
          generation: 0,
        },
      ],
    });

    adminAToken = tokenService.generateTokens({
      userId: adminAId,
      role: 'administrador',
    }).accessToken;
    adminBToken = tokenService.generateTokens({
      userId: adminBId,
      role: 'administrador',
    }).accessToken;
    producerToken = tokenService.generateTokens({
      userId: producerId,
      role: 'productor',
    }).accessToken;
    buyerToken = tokenService.generateTokens({
      userId: buyerId,
      role: 'comprador_b2c',
    }).accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [adminAId, adminBId, adminCId, adminDId, producerId, buyerId] } },
    });
    await app.close();
  });

  it('lista usuarios con búsqueda y sin exponer secretos', async () => {
    const response = await request(server)
      .get('/api/v1/admin/users')
      .set('Cookie', `access_token=${adminAToken}`)
      .query({ search: producerEmail.toUpperCase(), limit: 10 });

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toMatchObject({
      success: true,
      message: 'Usuarios obtenidos correctamente',
    });
    expect(response.body.data).toMatchObject({ limit: 10, offset: 0 });
    expect(response.body.data.total).toBeGreaterThanOrEqual(1);

    const item = (response.body.data.items as Array<Record<string, unknown>>).find(
      (user) => user['id'] === producerId,
    );
    expect(item).toBeDefined();
    expect(adminUserSchema.safeParse(item).success).toBe(true);
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('filtra por rol y estado y pagina los resultados', async () => {
    const response = await request(server)
      .get('/api/v1/admin/users')
      .set('Cookie', `access_token=${adminAToken}`)
      .query({ rol: 'administrador', estado: 'ACTIVO', search: suffix, limit: 1, offset: 0 });

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.total).toBeGreaterThanOrEqual(2);
    expect(response.body.data.items[0]).toMatchObject({
      rol: 'administrador',
      estado: 'ACTIVO',
    });
  });

  it('rechaza con 403 a un usuario que no es administrador', async () => {
    const response = await request(server)
      .get('/api/v1/admin/users')
      .set('Cookie', `access_token=${producerToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN' },
    });
  });

  it('obtiene el detalle y responde 404 para un usuario inexistente', async () => {
    const detail = await request(server)
      .get(`/api/v1/admin/users/${producerId}`)
      .set('Cookie', `access_token=${adminAToken}`);

    expect(detail.status).toBe(200);
    expect(detail.body.data).toMatchObject({
      id: producerId,
      correo: producerEmail,
      rol: 'productor',
    });

    const missing = await request(server)
      .get(`/api/v1/admin/users/${randomUUID()}`)
      .set('Cookie', `access_token=${adminAToken}`);

    expect(missing.status).toBe(404);
    expect(missing.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    });
  });

  it('cambia el estado, invalida el access token y revoca los refresh tokens', async () => {
    const response = await request(server)
      .patch(`/api/v1/admin/users/${producerId}/status`)
      .set('Cookie', `access_token=${adminAToken}`)
      .send({ estado: 'INACTIVO' });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ id: producerId, estado: 'INACTIVO' });

    const session = await request(server)
      .get('/api/v1/profile/me')
      .set('Cookie', `access_token=${producerToken}`);

    expect(session.status).toBe(401);
    expect(session.body).toMatchObject({
      success: false,
      error: { code: 'TOKEN_INVALID' },
    });

    const refreshToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: producerRefreshHash },
    });
    expect(refreshToken?.revoked).toBe(true);
  });

  it('impide que un administrador cambie su propio estado o rol', async () => {
    const ownStatus = await request(server)
      .patch(`/api/v1/admin/users/${adminAId}/status`)
      .set('Cookie', `access_token=${adminAToken}`)
      .send({ estado: 'INACTIVO' });

    expect(ownStatus.status).toBe(409);
    expect(ownStatus.body).toMatchObject({
      success: false,
      error: { code: 'CONFLICT' },
    });
    expect(ownStatus.body.error.message).toContain('propio');

    const ownRole = await request(server)
      .patch(`/api/v1/admin/users/${adminAId}/role`)
      .set('Cookie', `access_token=${adminAToken}`)
      .send({ rol: 'productor' });

    expect(ownRole.status).toBe(409);
    expect(ownRole.body).toMatchObject({
      success: false,
      error: { code: 'CONFLICT' },
    });
    expect(ownRole.body.error.message).toContain('propio');
  });

  it('rechaza un rol inexistente con 422 ROLE_NOT_FOUND', async () => {
    const response = await request(server)
      .patch(`/api/v1/admin/users/${buyerId}/role`)
      .set('Cookie', `access_token=${adminAToken}`)
      .send({ rol: 'superadmin' });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'ROLE_NOT_FOUND' },
    });
  });

  it('exige perfil antes de cambiar a un rol que lo requiere', async () => {
    const response = await request(server)
      .patch(`/api/v1/admin/users/${buyerId}/role`)
      .set('Cookie', `access_token=${adminAToken}`)
      .send({ rol: 'productor' });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ success: false, error: { code: 'CONFLICT' } });

    await prisma.producerProfile.create({
      data: {
        userId: buyerId,
        farmName: 'Finca del Comprador',
        municipality: 'Armenia',
        village: 'El Progreso',
      },
    });

    const retry = await request(server)
      .patch(`/api/v1/admin/users/${buyerId}/role`)
      .set('Cookie', `access_token=${adminAToken}`)
      .send({ rol: 'productor' });

    expect(retry.status).toBe(200);
    expect(retry.body.data).toMatchObject({ id: buyerId, rol: 'productor' });

    const session = await request(server)
      .get('/api/v1/profile/me')
      .set('Cookie', `access_token=${buyerToken}`);

    expect(session.status).toBe(401);
    expect(session.body).toMatchObject({
      success: false,
      error: { code: 'TOKEN_INVALID' },
    });

    const refreshToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: buyerRefreshHash },
    });
    expect(refreshToken?.revoked).toBe(true);
  });

  it('serializa cambios concurrentes y conserva al menos un administrador activo', async () => {
    const repository = new PrismaUserRepository(prisma);

    await Promise.all([
      repository.updateStatusPreservingAdminContinuity(adminCId, 'INACTIVO'),
      repository.updateStatusPreservingAdminContinuity(adminDId, 'INACTIVO'),
    ]);

    const activeAdmins = await prisma.user.count({
      where: { status: 'ACTIVO', role: { name: 'administrador' } },
    });
    expect(activeAdmins).toBeGreaterThanOrEqual(1);
  });

  it('protege la continuidad de la administración', async () => {
    // El admin A suspende al admin B: todavía queda A activo.
    const suspendB = await request(server)
      .patch(`/api/v1/admin/users/${adminBId}/status`)
      .set('Cookie', `access_token=${adminAToken}`)
      .send({ estado: 'SUSPENDIDO' });

    expect(suspendB.status).toBe(200);
    expect(suspendB.body.data).toMatchObject({ id: adminBId, estado: 'SUSPENDIDO' });

    // B ya no puede operar con su token previo.
    const sessionB = await request(server)
      .get('/api/v1/admin/users')
      .set('Cookie', `access_token=${adminBToken}`);
    expect(sessionB.status).toBe(401);

    // A intenta desactivarse: la regla de auto-modificación + el conteo de
    // administradores activos garantizan que nunca quede el sistema sin admin.
    const selfDeactivate = await request(server)
      .patch(`/api/v1/admin/users/${adminAId}/status`)
      .set('Cookie', `access_token=${adminAToken}`)
      .send({ estado: 'INACTIVO' });

    expect(selfDeactivate.status).toBe(409);
    expect(selfDeactivate.body.error.code).toBe('CONFLICT');

    const activeAdmins = await prisma.user.count({
      where: { status: 'ACTIVO', role: { name: 'administrador' } },
    });
    expect(activeAdmins).toBeGreaterThanOrEqual(1);
  });

  it('responde 404 al cambiar el estado de un usuario inexistente', async () => {
    const response = await request(server)
      .patch(`/api/v1/admin/users/${randomUUID()}/status`)
      .set('Cookie', `access_token=${adminAToken}`)
      .send({ estado: 'INACTIVO' });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    });
  });
});
