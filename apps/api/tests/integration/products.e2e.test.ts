import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { PrismaService } from '../../src/prisma/prisma.service';

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

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();
    server = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);

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
});
