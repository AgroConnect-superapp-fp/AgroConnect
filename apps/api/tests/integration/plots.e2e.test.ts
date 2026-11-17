import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { plotListSchema, plotSchema } from '@agroconnect/contracts';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtTokenService } from '../../src/modules/identity/infrastructure/services/JwtTokenService';
import { env } from '../../src/shared/config/env';

/**
 * Prueba e2e del módulo geography contra PostgreSQL real con PostGIS.
 *
 * A diferencia del legacy, la parcela se registra EXCLUSIVAMENTE por la API
 * (`POST /api/v1/plots`): no se siembra el `centroid` a mano. Así la prueba
 * verifica de verdad que el trigger `plots_sync_geometry_trigger` deriva el
 * centroide y el área a partir del polígono, y que la búsqueda por proximidad
 * usa `ST_DWithin`/`ST_Distance` sobre esa geometría.
 *
 * El patrón de sesión (cookie `access_token` httpOnly + JWT emitido por
 * `JwtTokenService`) es el mismo de `products.e2e.test.ts`.
 *
 * Requiere el contenedor `agroconnect-postgres` (puerto 5434, BD
 * `agroconnect_test` con las migraciones aplicadas).
 */
describe('Plots (e2e)', () => {
  let app: NestExpressApplication;
  let server: Server;
  let prisma: PrismaService;

  const farmerId = randomUUID();
  const otherFarmerId = randomUUID();
  const buyerId = randomUUID();
  const suffix = `${Date.now()}`.slice(-8);
  const tokenService = new JwtTokenService(
    env.JWT_ACCESS_SECRET,
    env.JWT_REFRESH_SECRET,
    env.JWT_ACCESS_EXPIRES_IN,
    env.JWT_REFRESH_EXPIRES_IN,
    env.JWT_ISSUER,
    env.JWT_AUDIENCE,
  );
  let farmerToken = '';
  let otherFarmerToken = '';
  let buyerToken = '';

  /** Id de la parcela creada por la API en el primer test. */
  let plotId = '';

  // Triángulo de prueba en Salento (Quindío): centroide ≈ (-75.6833, 4.5333).
  const BOUNDARY = [
    [
      [-75.69, 4.53],
      [-75.68, 4.53],
      [-75.68, 4.54],
    ],
  ];

  // Punto de consulta: a ~250 m del centroide de la parcela.
  const LAT = 4.5339;
  const LNG = -75.6811;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();
    server = app.getHttpServer() as Server;

    prisma = app.get(PrismaService);

    // El catálogo sembrado no tiene rol `agricultor`: se usa `productor`,
    // que es el rol vigente para quien registra parcelas.
    const role = await prisma.role.findUniqueOrThrow({ where: { name: 'productor' } });
    const buyerRole = await prisma.role.findUniqueOrThrow({ where: { name: 'comprador_b2b' } });

    await prisma.user.createMany({
      data: [
        {
          id: farmerId,
          fullName: 'Agricultor de Pruebas',
          document: `G${suffix}`,
          email: `geo.${suffix}@example.com`,
          phone: `30${suffix.padStart(8, '0')}`,
          passwordHash: 'hash',
          roleId: role.id,
          status: 'ACTIVO',
          acceptsDataProcessing: true,
          emailVerifiedAt: new Date(),
        },
        {
          id: otherFarmerId,
          fullName: 'Otro Agricultor de Pruebas',
          document: `H${suffix}`,
          email: `geo.otro.${suffix}@example.com`,
          phone: `31${suffix.padStart(8, '0')}`,
          passwordHash: 'hash',
          roleId: role.id,
          status: 'ACTIVO',
          acceptsDataProcessing: true,
          emailVerifiedAt: new Date(),
        },
        {
          id: buyerId,
          fullName: 'Comprador de Pruebas',
          document: `I${suffix}`,
          email: `geo.comprador.${suffix}@example.com`,
          phone: `32${suffix.padStart(8, '0')}`,
          passwordHash: 'hash',
          roleId: buyerRole.id,
          status: 'ACTIVO',
          acceptsDataProcessing: true,
          emailVerifiedAt: new Date(),
        },
      ],
    });

    farmerToken = tokenService.generateTokens({
      userId: farmerId,
      role: 'productor',
    }).accessToken;
    otherFarmerToken = tokenService.generateTokens({
      userId: otherFarmerId,
      role: 'productor',
    }).accessToken;
    buyerToken = tokenService.generateTokens({
      userId: buyerId,
      role: 'comprador_b2b',
    }).accessToken;
  });

  afterAll(async () => {
    await prisma.$executeRaw`
      DELETE FROM plots WHERE farmer_id IN (${farmerId}::uuid, ${otherFarmerId}::uuid)
    `;
    await prisma.user.deleteMany({
      where: { id: { in: [farmerId, otherFarmerId, buyerId] } },
    });
    await app.close();
  });

  it('registra la parcela por la API y devuelve 201 con el sobre estándar', async () => {
    const response = await request(server)
      .post('/api/v1/plots')
      .set('Cookie', `access_token=${farmerToken}`)
      .send({
        name: 'Lote La Esperanza',
        municipality: 'Salento',
        department: 'Quindío',
        boundary: BOUNDARY,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Parcela registrada correctamente',
    });
    expect(plotSchema.safeParse(response.body.data).success).toBe(true);
    expect(response.body.data).toMatchObject({
      name: 'Lote La Esperanza',
      municipality: 'Salento',
      department: 'Quindío',
      farmerId,
    });

    plotId = response.body.data.id as string;
    expect(plotId).toEqual(expect.any(String));
  });

  it('la base de datos calculó el centroide y el área con el trigger de PostGIS', async () => {
    const rows = await prisma.$queryRaw<
      Array<{
        centroid_lat: number | null;
        centroid_lng: number | null;
        area_hectares: number;
        geom_is_null: boolean;
      }>
    >`
      SELECT
        ST_Y(centroid::geometry) AS centroid_lat,
        ST_X(centroid::geometry) AS centroid_lng,
        area_hectares,
        (geom IS NULL) AS geom_is_null
      FROM plots
      WHERE id = ${plotId}::uuid
    `;

    expect(rows).toHaveLength(1);
    const row = rows[0];
    if (!row) {
      throw new Error('La parcela creada no se encontró en la base de datos');
    }

    expect(row.geom_is_null).toBe(false);
    expect(row.centroid_lat).toBeCloseTo(4.5333, 3);
    expect(row.centroid_lng).toBeCloseTo(-75.6833, 3);
    // Área del triángulo de ~0.01° x 0.01° ≈ 61 ha (ST_Area sobre geography).
    expect(row.area_hectares).toBeGreaterThan(50);
    expect(row.area_hectares).toBeLessThan(80);
  });

  it('expone GET /api/v1/plots/nearby (público) con la parcela recién creada', async () => {
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
    // Punto a ~600 km de la parcela creada.
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

  it('lista las parcelas del agricultor autenticado en GET /api/v1/plots', async () => {
    const response = await request(server)
      .get('/api/v1/plots')
      .set('Cookie', `access_token=${farmerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Parcelas del agricultor obtenidas',
    });
    expect(plotListSchema.safeParse(response.body.data).success).toBe(true);
    expect(response.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: plotId, farmerId })]),
    );
  });

  it('devuelve el detalle de la parcela en GET /api/v1/plots/:id', async () => {
    const response = await request(server)
      .get(`/api/v1/plots/${plotId}`)
      .set('Cookie', `access_token=${farmerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Parcela obtenida correctamente',
    });
    expect(plotSchema.safeParse(response.body.data).success).toBe(true);
    expect(response.body.data).toMatchObject({ id: plotId, name: 'Lote La Esperanza' });
  });

  it('responde 403 cuando otro agricultor intenta consultar la parcela', async () => {
    const response = await request(server)
      .get(`/api/v1/plots/${plotId}`)
      .set('Cookie', `access_token=${otherFarmerToken}`);

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN' },
    });
  });

  it('actualiza parcialmente la parcela en PATCH /api/v1/plots/:id', async () => {
    const response = await request(server)
      .patch(`/api/v1/plots/${plotId}`)
      .set('Cookie', `access_token=${farmerToken}`)
      .send({ name: 'Lote La Esperanza Renombrado' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Parcela actualizada correctamente',
    });
    expect(response.body.data).toMatchObject({
      id: plotId,
      name: 'Lote La Esperanza Renombrado',
      municipality: 'Salento',
    });

    const rows = await prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM plots WHERE id = ${plotId}::uuid
    `;
    expect(rows[0]?.name).toBe('Lote La Esperanza Renombrado');
  });

  it('recalcula el centroide cuando el PATCH cambia la geometría', async () => {
    const nuevaGeometria = [
      [
        [-75.7, 4.5],
        [-75.6, 4.5],
        [-75.6, 4.6],
      ],
    ];

    const response = await request(server)
      .patch(`/api/v1/plots/${plotId}`)
      .set('Cookie', `access_token=${farmerToken}`)
      .send({ boundary: nuevaGeometria });

    expect(response.status).toBe(200);

    const rows = await prisma.$queryRaw<Array<{ centroid_lat: number | null }>>`
      SELECT ST_Y(centroid::geometry) AS centroid_lat
      FROM plots
      WHERE id = ${plotId}::uuid
    `;
    expect(rows[0]?.centroid_lat).toBeCloseTo(4.5333, 3);
  });

  it('expone la distancia en km calculada por PostGIS en /plots/nearby', async () => {
    // El centroide ACTUAL se lee de la base de datos: el test NO depende del
    // orden de ejecución ni de la geometría que dejó otro test (el PATCH la
    // desplaza). Así se verifica de verdad que PostGIS calcula la distancia.
    const filas = await prisma.$queryRaw<Array<{ lng: number; lat: number }>>`
      SELECT ST_X(centroid::geometry) AS lng, ST_Y(centroid::geometry) AS lat
      FROM plots
      WHERE id = ${plotId}::uuid
    `;

    const centroide = filas[0];
    expect(centroide).toBeDefined();
    expect(centroide?.lat).toBeGreaterThan(0);
    expect(centroide?.lng).toBeLessThan(0);

    // Punto de consulta 0.005° al norte del centroide (≈ 555 m en el elipsoide).
    const latConsulta = (centroide?.lat ?? 0) + 0.005;

    const response = await request(server)
      .get('/api/v1/plots/nearby')
      .query({ lat: latConsulta, lng: centroide?.lng, radius: 10 });

    expect(response.status).toBe(200);
    const nearby = response.body.data as Array<{ id: string; distanceKm: number }>;
    const propia = nearby.find((plot) => plot.id === plotId);
    expect(propia).toBeDefined();
    expect(typeof propia?.distanceKm).toBe('number');
    expect(propia?.distanceKm).toBeGreaterThan(0);
    // Margen para la curvatura del elipsoide: 0.005° de latitud ≈ 0.556 km.
    expect(propia?.distanceKm).toBeGreaterThan(0.4);
    expect(propia?.distanceKm).toBeLessThan(0.7);
  });

  it('pagina el listado propio con limit y offset', async () => {
    const response = await request(server)
      .get('/api/v1/plots')
      .query({ limit: 1, offset: 0 })
      .set('Cookie', `access_token=${farmerToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);

    const limiteInvalido = await request(server)
      .get('/api/v1/plots')
      .query({ limit: 500 })
      .set('Cookie', `access_token=${farmerToken}`);
    expect(limiteInvalido.status).toBe(422);
  });

  it('elimina lógicamente la parcela en DELETE /api/v1/plots/:id (204)', async () => {
    const response = await request(server)
      .delete(`/api/v1/plots/${plotId}`)
      .set('Cookie', `access_token=${farmerToken}`);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});

    const rows = await prisma.$queryRaw<Array<{ deleted_at: Date | null }>>`
      SELECT deleted_at FROM plots WHERE id = ${plotId}::uuid
    `;
    expect(rows[0]?.deleted_at).toBeInstanceOf(Date);
  });

  it('la parcela eliminada ya no aparece en el listado ni en la búsqueda', async () => {
    const listado = await request(server)
      .get('/api/v1/plots')
      .set('Cookie', `access_token=${farmerToken}`);

    expect(listado.status).toBe(200);
    const ids = (listado.body.data as Array<{ id: string }>).map((plot) => plot.id);
    expect(ids).not.toContain(plotId);

    const nearby = await request(server)
      .get('/api/v1/plots/nearby')
      .query({ lat: LAT, lng: LNG, radius: 10 });

    expect(nearby.status).toBe(200);
    const nearbyIds = (nearby.body.data as Array<{ id: string }>).map((plot) => plot.id);
    expect(nearbyIds).not.toContain(plotId);
  });

  it('exige sesión para el CRUD de parcelas', async () => {
    const listado = await request(server).get('/api/v1/plots');
    expect(listado.status).toBe(401);

    const detalle = await request(server).get(`/api/v1/plots/${plotId}`);
    expect(detalle.status).toBe(401);

    const alta = await request(server)
      .post('/api/v1/plots')
      .send({
        name: 'Lote Sin Sesión',
        municipality: 'Salento',
        department: 'Quindío',
        boundary: BOUNDARY,
      });
    expect(alta.status).toBe(401);
  });

  it('responde 403 cuando un comprador intenta gestionar una parcela', async () => {
    const alta = await request(server)
      .post('/api/v1/plots')
      .set('Cookie', `access_token=${buyerToken}`)
      .send({
        name: 'Lote Del Comprador',
        municipality: 'Salento',
        department: 'Quindío',
        boundary: BOUNDARY,
      });

    expect(alta.status).toBe(403);
    expect(alta.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN' },
    });

    const listado = await request(server)
      .get('/api/v1/plots')
      .set('Cookie', `access_token=${buyerToken}`);
    expect(listado.status).toBe(403);

    const edicion = await request(server)
      .patch(`/api/v1/plots/${plotId}`)
      .set('Cookie', `access_token=${buyerToken}`)
      .send({ name: 'Lote Renombrado Por Comprador' });
    expect(edicion.status).toBe(403);

    const baja = await request(server)
      .delete(`/api/v1/plots/${plotId}`)
      .set('Cookie', `access_token=${buyerToken}`);
    expect(baja.status).toBe(403);
  });

  it('responde 422 con un polígono degenerado (vértices colineales)', async () => {
    const response = await request(server)
      .post('/api/v1/plots')
      .set('Cookie', `access_token=${farmerToken}`)
      .send({
        name: 'Lote Degenerado',
        municipality: 'Salento',
        department: 'Quindío',
        boundary: [
          [
            [-75.69, 4.53],
            [-75.685, 4.53],
            [-75.68, 4.53],
          ],
        ],
      });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('rechaza con 422 un cuerpo de alta inválido (polígono con dos vértices)', async () => {
    const response = await request(server)
      .post('/api/v1/plots')
      .set('Cookie', `access_token=${farmerToken}`)
      .send({
        name: 'Lote Inválido',
        municipality: 'Salento',
        department: 'Quindío',
        boundary: [
          [
            [-75.69, 4.53],
            [-75.68, 4.53],
          ],
        ],
      });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });
});
