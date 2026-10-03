import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../../src/app';
import { prisma } from '../../src/shared/infrastructure/prisma';
import { Plot } from '../../src/modules/geography/domain/entities/Plot';
import { PrismaPlotRepository } from '../../src/modules/geography/infrastructure/repositories/PrismaPlotRepository';

const app = createApp();
const repository = new PrismaPlotRepository(prisma);

const suffix = `${Date.now()}`.slice(-8);
const roleId = randomUUID();
const farmerId = randomUUID();
const plotId = randomUUID();

// Coordenadas de Salento (Quindío) — finca de prueba
const LAT = 4.5339;
const LNG = -75.6811;

describe('API de geolocalización — parcelas (integración)', () => {
  beforeAll(async () => {
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
  });

  it('responde el estado del servicio', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: 'ok', service: 'agroconnect-api' });
  });

  it('guarda y recupera una parcela por id', async () => {
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

  it('encuentra parcelas dentro del radio de búsqueda', async () => {
    const plots = await repository.findNearby(LAT, LNG, 5);

    expect(plots.map((plot) => plot.id)).toContain(plotId);
  });

  it('no devuelve parcelas fuera del radio de búsqueda', async () => {
    // Punto a ~600 km (Cartagena) con radio de 1 km
    const plots = await repository.findNearby(10.391, -75.4795, 1);

    expect(plots.map((plot) => plot.id)).not.toContain(plotId);
  });

  it('expone GET /api/v1/plots/nearby con las parcelas cercanas', async () => {
    const response = await request(app)
      .get('/api/v1/plots/nearby')
      .query({ lat: LAT, lng: LNG, radius: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true });
    expect(response.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: plotId })]),
    );
  });

  it('responde 400 con coordenadas inválidas', async () => {
    const response = await request(app)
      .get('/api/v1/plots/nearby')
      .query({ lat: 999, lng: 999 });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false });
  });

  it('responde 404 para rutas desconocidas', async () => {
    const response = await request(app).get('/api/v1/desconocido');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND' },
    });
  });
});
