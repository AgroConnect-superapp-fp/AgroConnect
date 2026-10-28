import type { Server } from 'node:http';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Prueba e2e del endpoint de salud.
 *
 * `PrismaService` se sustituye por un doble: este endpoint NO toca la base de
 * datos, así que la prueba no necesita un PostGIS levantado.
 */
describe('Health (e2e)', () => {
  let app: INestApplication;
  let server: Server;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({
        onModuleInit: jest.fn(),
        onModuleDestroy: jest.fn(),
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde 200 en GET /health con el contrato del backend legacy', async () => {
    const response = await request(server).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: 'agroconnect-api' });
  });

  it('devuelve el correlation ID en la cabecera x-correlation-id', async () => {
    const response = await request(server).get('/health');

    expect(response.headers['x-correlation-id']).toBeDefined();
  });

  it('respeta el correlation ID entrante', async () => {
    const response = await request(server)
      .get('/health')
      .set('x-correlation-id', 'test-correlation-1');

    expect(response.headers['x-correlation-id']).toBe('test-correlation-1');
  });

  it('no expone /health bajo el prefijo /api/v1 (falla con 404)', async () => {
    const response = await request(server).get('/api/v1/health');

    expect(response.status).toBe(404);
  });
});
