import { execFile, spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';

/**
 * Pruebas de integración contra PostGIS REAL (Testcontainers).
 *
 * El docker-compose de desarrollo usa `postgis/postgis:16-3.4`; aquí se levanta
 * la MISMA imagen para validar, contra el motor real, lo que el backend no
 * puede comprobar con la base de pruebas local:
 *
 *  - la extensión `postgis` y el tipo `geography` existen;
 *  - `ST_DWithin` (búsqueda de parcelas cercanas) encuentra la parcela de
 *    Salento (Quindío) dentro de un radio de 5 km;
 *  - `ST_Centroid` y `ST_Area` son coherentes con `area_hectares`;
 *  - el CHECK `plots_centroid_colombia_check` rechaza una parcela fuera de
 *    Colombia (error 23514).
 *
 * El esquema NO se inventa: se aplican las migraciones reales del repositorio
 * con `prisma migrate deploy` contra el contenedor.
 *
 * Si el entorno no tiene Docker, la suite se OMITE de forma explícita (nunca
 * se reporta como si hubiera pasado).
 */

const POSTGIS_IMAGE = 'postgis/postgis:16-3.4';
const POSTGRES_DB = 'agroconnect_test';
const POSTGRES_USER = 'agroconnect';
const POSTGRES_PASSWORD = 'agroconnect_test';
const POSTGRES_PORT = 5432;

const API_DIR = path.resolve(__dirname, '../..');
const MIGRATIONS_DIR = path.join(API_DIR, 'prisma', 'migrations');
const PRISMA_CANDIDATES = [
  path.resolve(API_DIR, '../../node_modules/.bin/prisma'),
  path.join(API_DIR, 'node_modules', '.bin', 'prisma'),
];

const SALENTO = { lng: -75.487, lat: 4.644 };
const RADIO_METROS = 5000;

const ROL_PRODUCTOR = 'productor';
const USUARIO_ID = '00000000-0000-4000-8000-0000000000a1';
const PARCELA_CERCANA_ID = '00000000-0000-4000-8000-0000000000b1';
const PARCELA_LEJANA_ID = '00000000-0000-4000-8000-0000000000b2';
const PARCELA_FUERA_DE_COLOMBIA_ID = '00000000-0000-4000-8000-0000000000b3';

/** Polígono de 0.002° x 0.002° alrededor del centroide de Salento. */
const POLIGONO_SALENTO = JSON.stringify({
  type: 'Polygon',
  coordinates: [
    [
      [-75.488, 4.643],
      [-75.486, 4.643],
      [-75.486, 4.645],
      [-75.488, 4.645],
      [-75.488, 4.643],
    ],
  ],
});

/** Polígono en París (Île-de-France): debe violar el CHECK de Colombia. */
const POLIGONO_PARIS = JSON.stringify({
  type: 'Polygon',
  coordinates: [
    [
      [2.35, 48.85],
      [2.36, 48.85],
      [2.36, 48.86],
      [2.35, 48.86],
      [2.35, 48.85],
    ],
  ],
});

function dockerDisponible(): boolean {
  if (process.env['DOCKER_HOST']) {
    return true;
  }
  if (existsSync('/var/run/docker.sock')) {
    return true;
  }
  const resultado = spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], {
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return resultado.status === 0;
}

/**
 * El CHECK de Colombia vive en una migración. Si esa migración no existe, la
 * prueba se omite con una razón explícita en lugar de fingir cobertura.
 */
function checkColombiaDeclarado(): boolean {
  if (!existsSync(MIGRATIONS_DIR)) {
    return false;
  }
  return readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .some((entrada) => {
      const archivo = path.join(MIGRATIONS_DIR, entrada.name, 'migration.sql');
      return existsSync(archivo) && readFileSync(archivo, 'utf8').includes('plots_centroid_colombia_check');
    });
}

const DOCKER_DISPONIBLE = dockerDisponible();
const CHECK_DECLARADO = checkColombiaDeclarado();

const describeConDocker = DOCKER_DISPONIBLE ? describe : describe.skip;
const describeConCheck = CHECK_DECLARADO ? describe : describe.skip;

const TITULO_DOCKER = DOCKER_DISPONIBLE
  ? 'PostGIS real (Testcontainers)'
  : 'PostGIS real (Testcontainers) — OMITIDO: no hay demonio Docker disponible en este entorno';

const TITULO_CHECK = CHECK_DECLARADO
  ? 'CHECK de Colombia (plots_centroid_colombia_check)'
  : 'CHECK de Colombia — OMITIDO: ninguna migración declara plots_centroid_colombia_check';

async function esperarPostgres(pool: Pool, intentos = 30, esperaMs = 1000): Promise<void> {
  let ultimoError: unknown;
  for (let intento = 0; intento < intentos; intento += 1) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (error) {
      ultimoError = error;
      await new Promise((resolve) => setTimeout(resolve, esperaMs));
    }
  }
  throw new Error(
    `PostGIS no respondió tras ${intentos} intentos: ${ultimoError instanceof Error ? ultimoError.message : String(ultimoError)}`,
  );
}

async function aplicarMigraciones(url: string): Promise<void> {
  const binario = PRISMA_CANDIDATES.find((candidato) => existsSync(candidato));
  if (!binario) {
    throw new Error(
      `No se encontró el CLI de Prisma. Candidatos revisados: ${PRISMA_CANDIDATES.join(', ')}`,
    );
  }

  await new Promise<void>((resolve, reject) => {
    execFile(
      binario,
      ['migrate', 'deploy'],
      {
        cwd: API_DIR,
        env: { ...process.env, DATABASE_URL: url, DATABASE_SCHEMA: 'public' },
        timeout: 180_000,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              `prisma migrate deploy falló contra el contenedor: ${stderr || stdout || error.message}`,
            ),
          );
          return;
        }
        resolve();
      },
    );
  });
}

describeConDocker(TITULO_DOCKER, () => {
  let container: StartedTestContainer | undefined;
  let pool: Pool | undefined;

  beforeAll(async () => {
    container = await new GenericContainer(POSTGIS_IMAGE)
      .withEnvironment({
        POSTGRES_DB,
        POSTGRES_USER,
        POSTGRES_PASSWORD,
      })
      .withExposedPorts(POSTGRES_PORT)
      .withWaitStrategy(
        Wait.forLogMessage(/database system is ready to accept connections/).withStartupTimeout(
          180_000,
        ),
      )
      .start();

    const url = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${container.getHost()}:${container.getMappedPort(POSTGRES_PORT)}/${POSTGRES_DB}`;
    pool = new Pool({ connectionString: url, max: 2 });

    await esperarPostgres(pool);
    await pool.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    await aplicarMigraciones(url);

    const rol = await pool.query<{ id: string }>('SELECT id FROM roles WHERE nombre = $1', [
      ROL_PRODUCTOR,
    ]);
    if (rol.rows.length === 0) {
      throw new Error('La migración inicial no insertó el rol "productor"');
    }

    await pool.query(
      `INSERT INTO users
         (id, nombre_completo, documento, correo, celular, password_hash, rol_id, estado,
          acepta_tratamiento_datos, fecha_registro, actualizado_en)
       VALUES ($1, 'Productor PostGIS', '901000001', 'postgis@agroconnect.local', '3010000001',
               'hash-de-prueba', $2, 'ACTIVO', true, now(), now())`,
      [USUARIO_ID, rol.rows[0]?.id],
    );

    await pool.query(
      `INSERT INTO plots (id, name, municipality, department, farmer_id, geom)
       VALUES ($1, 'Lote La Esperanza', 'Salento', 'Quindío', $2,
               ST_SetSRID(ST_GeomFromGeoJSON($3::text), 4326))`,
      [PARCELA_CERCANA_ID, USUARIO_ID, POLIGONO_SALENTO],
    );

    await pool.query(
      `INSERT INTO plots (id, name, municipality, department, farmer_id, geom)
       VALUES ($1, 'Lote La Cuchilla', 'Pijao', 'Quindío', $2,
               ST_SetSRID(ST_GeomFromGeoJSON($3::text), 4326))`,
      [
        PARCELA_LEJANA_ID,
        USUARIO_ID,
        JSON.stringify({
          type: 'Polygon',
          coordinates: [
            [
              [-75.305, 4.635],
              [-75.303, 4.635],
              [-75.303, 4.637],
              [-75.305, 4.637],
              [-75.305, 4.635],
            ],
          ],
        }),
      ],
    );
  }, 300_000);

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
    if (container) {
      await container.stop();
    }
  });

  it('tiene instalada la extensión postgis y disponible el tipo geography', async () => {
    const extension = await pool!.query<{ extname: string }>(
      "SELECT extname FROM pg_extension WHERE extname = 'postgis'",
    );
    const tipo = await pool!.query<{ existe: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geography') AS existe",
    );

    expect(extension.rows).toHaveLength(1);
    expect(extension.rows[0]?.extname).toBe('postgis');
    expect(tipo.rows[0]?.existe).toBe(true);
  });

  it('ST_DWithin encuentra la parcela cercana a Salento dentro de 5 km', async () => {
    const resultado = await pool!.query<{ id: string; name: string; distancia_m: string }>(
      `SELECT id, name, ST_Distance(centroid, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distancia_m
         FROM plots
        WHERE deleted_at IS NULL
          AND ST_DWithin(centroid, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, $3)
        ORDER BY distancia_m`,
      [SALENTO.lng, SALENTO.lat, RADIO_METROS],
    );

    expect(resultado.rows).toHaveLength(1);
    expect(resultado.rows[0]?.id).toBe(PARCELA_CERCANA_ID);
    expect(resultado.rows[0]?.name).toBe('Lote La Esperanza');
    expect(Number(resultado.rows[0]?.distancia_m)).toBeLessThan(RADIO_METROS);
  });

  it('la parcela de Pijao queda FUERA del radio de 5 km de Salento', async () => {
    const resultado = await pool!.query<{ id: string; distancia_m: string }>(
      `SELECT id, ST_Distance(centroid, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) AS distancia_m
         FROM plots
        WHERE id = $3`,
      [SALENTO.lng, SALENTO.lat, PARCELA_LEJANA_ID],
    );

    const distancia = Number(resultado.rows[0]?.distancia_m);
    expect(resultado.rows).toHaveLength(1);
    expect(distancia).toBeGreaterThan(RADIO_METROS);
  });

  it('ST_Centroid y ST_Area son coherentes con area_hectares', async () => {
    const resultado = await pool!.query<{
      centroide: string;
      area_m2: string;
      area_hectares: string;
    }>(
      `SELECT ST_AsText(ST_Centroid(geom)) AS centroide,
              ST_Area(geom::geography) AS area_m2,
              area_hectares
         FROM plots
        WHERE id = $1`,
      [PARCELA_CERCANA_ID],
    );

    const fila = resultado.rows[0];
    expect(fila).toBeDefined();
    expect(fila?.centroide).toContain('-75.487');
    expect(fila?.centroide).toContain('4.644');

    const areaM2 = Number(fila?.area_m2);
    expect(areaM2).toBeGreaterThan(45_000);
    expect(areaM2).toBeLessThan(55_000);
    expect(Number(fila?.area_hectares)).toBeCloseTo(areaM2 / 10_000, 6);
  });

  describeConCheck(TITULO_CHECK, () => {
    it('el CHECK de Colombia está aplicado en la base de datos', async () => {
      const constraint = await pool!.query<{ conname: string }>(
        `SELECT conname FROM pg_constraint WHERE conname = 'plots_centroid_colombia_check'`,
      );

      expect(constraint.rows).toHaveLength(1);
      expect(constraint.rows[0]?.conname).toBe('plots_centroid_colombia_check');
    });

    it('rechaza con 23514 una parcela fuera del territorio colombiano', async () => {
      await expect(
        pool!.query(
          `INSERT INTO plots (id, name, municipality, department, farmer_id, geom)
           VALUES ($1, 'Lote en París', 'París', 'Île-de-France', $2,
                   ST_SetSRID(ST_GeomFromGeoJSON($3::text), 4326))`,
          [PARCELA_FUERA_DE_COLOMBIA_ID, USUARIO_ID, POLIGONO_PARIS],
        ),
      ).rejects.toMatchObject({ code: '23514' });
    });
  });
});
