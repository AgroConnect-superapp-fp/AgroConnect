import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { PrismaService } from '../../src/prisma/prisma.service';
import { Plot } from '../../src/modules/geography/domain/entities/Plot';
import { PrismaPlotRepository } from '../../src/modules/geography/infrastructure/repositories/PrismaPlotRepository';
import { PLOT_REPOSITORY } from '../../src/modules/geography/application/tokens';

/**
 * Prueba e2e del módulo geography contra la base de datos real con PostGIS.
 *
 * Réplica del patrón del backend legacy (`backend/tests/integration/plots.spec.ts`):
 * siembra rol → agricultor → parcela (el `centroid` lo escribe la base con
 * `ST_SetSRID(ST_MakePoint(...), 4326)`, nunca el código de aplicación) y
 * verifica `GET /api/v1/plots/nearby` con `ST_DWithin` real.
 *
 * Requiere el contenedor `agroconnect-postgres` (puerto 5434, BD
 * `agroconnect_test` con las migraciones aplicadas).
 */
describe('Plots (e2e)', () => {
  let app: NestExpressApplication;
  let server: Server;
  let prisma: PrismaService;
  let repository: PrismaPlotRepository;

  const roleId = randomUUID();
  const farmerId = randomUUID();
  const plotId = randomUUID();
  const suffix = `${Date.now()}`.slice(-8);

  // Coordenadas de Salento (Quindío) — finca de prueba
  const LAT = 4.5339;
  const LNG = -75.6811;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });
    await app.init();
    server = app.getHttpServer() as Server;

    prisma = app.get(PrismaService);
    repository = app.get<PrismaPlotRepository>(PLOT_REPOSITORY);

    await prisma.$executeRaw`
      INSERT INTO roles (id, nombre, descripcion)
      VALUES (${roleId}::uuid, ${`rol_geo_${suffix}`}, 'Rol de pruebas de geolocalización')
    `;
    await prisma.$executeRaw`
      INSERT INTO users (
        id, nombre_completo, documento, correo, celular,
        password_hash, rol_id, estado, acepta_tratamiento_datos, actualizado_en
      )
      VALUES (
        ${farmerId}::uuid,
        'Agricultor de Pruebas',
        ${`DOC${suffix}`},
        ${`geo.${suffix}@example.com`},
        ${`3${suffix.padStart(9, '0')}`},
        'hash_de_prueba',
        ${roleId}::uuid,
        'ACTIVO',
        true,
        CURRENT_TIMESTAMP
      )
    `;

    // El repositorio portado escribe la parcela SIN centroid: lo completa la BD.
    await repository.save(
      new Plot(plotId, 'Lote La Esperanza', 3.5, 'Salento', 'Quindío', farmerId),
    );
    await prisma.$executeRaw`
      UPDATE plots
      SET centroid = ST_SetSRID(ST_MakePoint(${LNG}, ${LAT}), 4326)::geography
      WHERE id = ${plotId}::uuid
    `;
  });

  afterAll(async () => {
    await prisma.$executeRaw`DELETE FROM plots WHERE id = ${plotId}::uuid`;
    await prisma.$executeRaw`DELETE FROM users WHERE id = ${farmerId}::uuid`;
    await prisma.$executeRaw`DELETE FROM roles WHERE id = ${roleId}::uuid`;
    await app.close();
  });

  it('guarda y recupera una parcela por id con el repositorio portado', async () => {
    const plot = await repository.findById(plotId);

    expect(plot).not.toBeNull();
    expect(plot).toMatchObject({
      id: plotId,
      name: 'Lote La Esperanza',
      areaHectares: 3.5,
      municipality: 'Salento',
      department: 'Quindío',
      farmerId,
    });
  });

  it('devuelve null cuando la parcela no existe', async () => {
    const plot = await repository.findById(randomUUID());

    expect(plot).toBeNull();
  });

  it('expone GET /api/v1/plots/nearby con las parcelas dentro del radio', async () => {
    const response = await request(server)
      .get('/api/v1/plots/nearby')
      .query({ lat: LAT, lng: LNG, radius: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Búsqueda de parcelas cercanas realizada',
    });
    expect(response.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: plotId })]),
    );
  });

  it('no devuelve la parcela cuando queda fuera del radio (Cartagena, 1 km)', async () => {
    // Punto a ~600 km de la parcela sembrada.
    const response = await request(server)
      .get('/api/v1/plots/nearby')
      .query({ lat: 10.391, lng: -75.4795, radius: 1 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true });
    const ids = (response.body.data as Array<{ id: string }>).map((plot) => plot.id);
    expect(ids).not.toContain(plotId);
  });

  it('usa el radio por defecto de 10 km cuando no se envía', async () => {
    const response = await request(server)
      .get('/api/v1/plots/nearby')
      .query({ lat: LAT, lng: LNG });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: plotId })]),
    );
  });

  it('rechaza con 422 una latitud fuera de rango (barrera del contrato)', async () => {
    const response = await request(server)
      .get('/api/v1/plots/nearby')
      .query({ lat: 999, lng: LNG });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('rechaza con 422 un radio fuera de rango', async () => {
    const cero = await request(server)
      .get('/api/v1/plots/nearby')
      .query({ lat: LAT, lng: LNG, radius: 0 });

    expect(cero.status).toBe(422);
    expect(cero.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });

    const excesivo = await request(server)
      .get('/api/v1/plots/nearby')
      .query({ lat: LAT, lng: LNG, radius: 101 });

    expect(excesivo.status).toBe(422);
    expect(excesivo.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });
});
