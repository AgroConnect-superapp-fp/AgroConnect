import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { configureApp } from '../../../src/app.setup';

/**
 * Regresión del límite de cuerpo JSON.
 *
 * El parser de body-parser rechaza con 413 antes de que la petición llegue al
 * router. Esta prueba demuestra dos cosas en una app Nest real:
 *  - el 413 conserva el contrato de errores de la API;
 *  - CORS se ejecutó antes del parser, así que el navegador puede leer la
 *    respuesta de error en lugar de reportar un fallo CORS.
 */
describe('configureApp — cuerpo JSON y CORS', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({}).compile();
    app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde 413 con contrato de errores y cabeceras CORS para un JSON > 32kb', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('Origin', 'http://localhost:5173')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ x: 'a'.repeat(40_000) }));

    expect(response.status).toBe(413);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
    expect(response.headers['access-control-expose-headers']).toBe('x-correlation-id');
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'El cuerpo de la petición supera el límite de 32kb.',
      },
      correlationId: expect.any(String),
    });
  });
});
