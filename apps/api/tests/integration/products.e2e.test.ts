import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtTokenService } from '../../src/modules/identity/infrastructure/services/JwtTokenService';
import { env } from '../../src/shared/config/env';

/**
 * Prueba e2e de `GET /api/v1/products` contra PostgreSQL real.
 *
 * Verifica la barrera del contrato, los filtros ILIKE/enum y la paginación.
 * Requiere el contenedor PostGIS de pruebas (5434) con las migraciones
 * aplicadas; CI lo levanta antes de ejecutar Jest.
 */
describe('Products (e2e)', () => {
  let app: NestExpressApplication;
  let server: Server;
  let prisma: PrismaService;

  const productId = randomUUID();
  const suffix = `${Date.now()}`.slice(-8);
  const name = `Finca de Pruebas ${suffix}`;
  const producerId = randomUUID();
  const buyerId = randomUUID();
  const tokenService = new JwtTokenService(
    env.JWT_ACCESS_SECRET,
    env.JWT_REFRESH_SECRET,
    env.JWT_ACCESS_EXPIRES_IN,
    env.JWT_REFRESH_EXPIRES_IN,
    env.JWT_ISSUER,
    env.JWT_AUDIENCE,
  );
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

    const producerRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'productor' },
    });
    const buyerRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'comprador_b2c' },
    });
    await prisma.user.createMany({
      data: [
        {
          id: producerId,
          fullName: 'Productor E2E',
          document: `P${suffix}`,
          email: `producer.${suffix}@example.com`,
          phone: `30${suffix.padStart(8, '0')}`,
          passwordHash: 'hash',
          roleId: producerRole.id,
          status: 'ACTIVO',
          acceptsDataProcessing: true,
          emailVerifiedAt: new Date(),
        },
        {
          id: buyerId,
          fullName: 'Comprador E2E',
          document: `C${suffix}`,
          email: `buyer.${suffix}@example.com`,
          phone: `31${suffix.padStart(8, '0')}`,
          passwordHash: 'hash',
          roleId: buyerRole.id,
          status: 'ACTIVO',
          acceptsDataProcessing: true,
          emailVerifiedAt: new Date(),
        },
      ],
    });
    producerToken = tokenService.generateTokens({
      userId: producerId,
      role: 'productor',
    }).accessToken;
    buyerToken = tokenService.generateTokens({
      userId: buyerId,
      role: 'comprador_b2c',
    }).accessToken;

    await prisma.product.create({
      data: {
        id: productId,
        name,
        owner: 'Productor de Pruebas',
        description: 'Producto sembrado por la prueba e2e del marketplace.',
        contact: '+57 300 000 00 00',
        department: 'Quindío',
        municipality: 'Salento',
        crop: 'coffee',
        areaHectares: 12.5,
        productivity: 88,
        certification: 'organic',
        lat: 4.5339,
        lng: -75.6811,
        producerId,
        images: [
          {
            publicId: 'cld-sample-4',
            alt: 'Café de prueba',
            url: 'https://res.cloudinary.com/demo/cafe.jpg',
            width: 600,
            height: 400,
            bytes: 12345,
            uploadedAt: '2026-11-03T00:00:00.000Z',
            moderationStatus: 'approved',
            lqip: 'data:image/png;base64,abc',
          },
          { alt: 'Imagen sin publicId' },
          { publicId: '' },
          null,
        ],
        coordinates: [[4.53, -75.68], [4.54, -75.67], 'no-es-un-punto'],
      },
    });
  });

  afterAll(async () => {
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.product.deleteMany({ where: { producerId } });
    await prisma.user.deleteMany({ where: { id: { in: [producerId, buyerId] } } });
    await app.close();
  });

  it('lista los productos con el sobre estándar', async () => {
    const response = await request(server).get('/api/v1/products').query({ limit: 100 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Productos del marketplace obtenidos',
    });
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: productId,
          name,
          owner: 'Productor de Pruebas',
          crop: 'coffee',
          area: 12.5,
          certification: 'organic',
          lat: 4.5339,
          lng: -75.6811,
          images: [
            expect.objectContaining({
              publicId: 'cld-sample-4',
              moderationStatus: 'approved',
            }),
          ],
          coordinates: [
            [4.53, -75.68],
            [4.54, -75.67],
          ],
        }),
      ]),
    );
  });

  it('busca por nombre sin distinguir mayúsculas', async () => {
    const response = await request(server)
      .get('/api/v1/products')
      .query({ search: name.toUpperCase() });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: productId })]),
    );
  });

  it('filtra por cultivo y departamento', async () => {
    const response = await request(server).get('/api/v1/products').query({
      search: name,
      crop: 'coffee',
      department: 'quindío',
      municipality: 'salento',
      certification: 'organic',
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({ id: productId, crop: 'coffee' });
  });

  it('pagina los resultados', async () => {
    const first = await request(server)
      .get('/api/v1/products')
      .query({ search: name, limit: 1, offset: 0 });

    expect(first.status).toBe(200);
    expect(first.body.data).toHaveLength(1);

    const second = await request(server)
      .get('/api/v1/products')
      .query({ search: name, limit: 1, offset: 1 });

    expect(second.status).toBe(200);
    expect(second.body.data).toHaveLength(0);
  });

  it('rechaza un cultivo fuera del contrato con 422', async () => {
    const response = await request(server).get('/api/v1/products').query({ crop: 'tomate' });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('rechaza un límite fuera de rango con 422', async () => {
    const response = await request(server).get('/api/v1/products').query({ limit: 0 });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  describe('PATCH /api/v1/products/:id (imágenes del propietario)', () => {
    it('reemplaza las imágenes del producto autenticado', async () => {
      const response = await request(server)
        .patch(`/api/v1/products/${productId}`)
        .set('Cookie', `access_token=${producerToken}`)
        .send({
          images: [
            {
              publicId: `agroconnect/products/${producerId}/actualizada`,
              alt: 'Imagen actualizada',
              url: 'https://res.cloudinary.com/demo/image/upload/e2e.png',
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Imágenes del producto actualizadas',
        data: {
          id: productId,
          images: [
            expect.objectContaining({
              publicId: `agroconnect/products/${producerId}/actualizada`,
            }),
          ],
        },
      });
    });

    it('rechaza a un comprador con 403', async () => {
      const response = await request(server)
        .patch(`/api/v1/products/${productId}`)
        .set('Cookie', `access_token=${buyerToken}`)
        .send({ images: [] });

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        success: false,
        error: { code: 'FORBIDDEN' },
      });
    });

    it('rechaza más de 6 imágenes con 422', async () => {
      const response = await request(server)
        .patch(`/api/v1/products/${productId}`)
        .set('Cookie', `access_token=${producerToken}`)
        .send({
          images: Array.from({ length: 7 }, (_, index) => ({ publicId: `imagen-${index}` })),
        });

      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({
        success: false,
        error: { code: 'VALIDATION_ERROR' },
      });
    });
  });

  describe('POST /api/v1/uploads/signature', () => {
    it('rechaza sin cookie de sesión con 401', async () => {
      const response = await request(server).post('/api/v1/uploads/signature');

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: { code: 'TOKEN_INVALID' },
      });
    });

    it('rechaza a un comprador con 403', async () => {
      const response = await request(server)
        .post('/api/v1/uploads/signature')
        .set('Cookie', `access_token=${buyerToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        success: false,
        error: { code: 'FORBIDDEN' },
      });
    });

    it('responde 503 si Cloudinary no está configurado', async () => {
      const response = await request(server)
        .post('/api/v1/uploads/signature')
        .set('Cookie', `access_token=${producerToken}`);

      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({
        success: false,
        error: { code: 'SERVICE_UNAVAILABLE' },
      });
    });
  });

  describe('POST /api/v1/products (publicación autenticada)', () => {
    it('rechaza sin cookie de sesión con 401', async () => {
      const response = await request(server).post('/api/v1/products').send({});

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        success: false,
        error: { code: 'TOKEN_INVALID' },
      });
    });

    it('rechaza a un comprador con 403', async () => {
      const response = await request(server)
        .post('/api/v1/products')
        .set('Cookie', `access_token=${buyerToken}`)
        .send({
          name: 'Producto de comprador',
          department: 'Quindío',
          municipality: 'Salento',
          crop: 'coffee',
          area: 1,
          productivity: 50,
          lat: 4.5,
          lng: -75.6,
        });

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        success: false,
        error: { code: 'FORBIDDEN' },
      });
    });

    it('publica con un productor autenticado y responde 201', async () => {
      const response = await request(server)
        .post('/api/v1/products')
        .set('Cookie', `access_token=${producerToken}`)
        .send({
          name: `Cosecha E2E ${suffix}`,
          department: 'Quindío',
          municipality: 'Salento',
          crop: 'coffee',
          area: 8.5,
          productivity: 91,
          certification: 'organic',
          lat: 4.5339,
          lng: -75.6811,
          images: [{ publicId: `agroconnect/products/${producerId}/cosecha-e2e`, alt: 'Café E2E' }],
          coordinates: [
            [4.53, -75.68],
            [4.54, -75.67],
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Producto publicado correctamente',
        data: {
          name: `Cosecha E2E ${suffix}`,
          producerId,
          crop: 'coffee',
        },
      });
    });

    it('rechaza un cuerpo inválido con 422', async () => {
      const response = await request(server)
        .post('/api/v1/products')
        .set('Cookie', `access_token=${producerToken}`)
        .send({
          name: 'X',
          department: 'Q',
          municipality: 'S',
          crop: 'tomate',
          area: 0,
          productivity: 200,
          lat: 100,
          lng: -200,
        });

      expect(response.status).toBe(422);
      expect(response.body).toMatchObject({
        success: false,
        error: { code: 'VALIDATION_ERROR' },
      });
    });
  });
});
