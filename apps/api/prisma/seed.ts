/**
 * Seed determinista e idempotente de AgroConnect (desarrollo y pruebas).
 *
 * Qué siembra:
 *  - Los 5 roles reales del dominio: administrador, comprador_b2b,
 *    comprador_b2c, productor y transportista.
 *  - Un administrador y un agricultor de prueba (rol `productor`).
 *  - Tres parcelas con polígono GeoJSON real en Salento y Pijao (Quindío).
 *
 * Decisiones de diseño:
 *  - SQL crudo parametrizado (`$1, $2, ...`). El seed escribe en columnas que
 *    Prisma no puede modelar (`geom geometry(Polygon,4326)`) y el polígono se
 *    construye en la base de datos con
 *    `ST_SetSRID(ST_GeomFromGeoJSON($n::text), 4326)`.
 *  - `centroid` y `area_hectares` NO se escriben: los calcula el trigger
 *    `plots_sync_geometry_trigger` (ST_Centroid / ST_Area sobre `geography`).
 *    Escribir a mano esos valores duplicaría la verdad de la geometría.
 *  - Idempotencia por claves naturales: `roles.nombre` (UNIQUE) y
 *    `users.correo` (UNIQUE) con `ON CONFLICT`; las parcelas usan UUID fijos
 *    y `ON CONFLICT (id)`. Ejecutar el seed N veces deja el mismo estado.
 *  - Guard de entorno (HALLAZGO de seguridad): el seed solo corre en
 *    `development`/`test` y contra una base de datos local (`localhost`,
 *    `127.0.0.1`, `::1`). Para cualquier otro destino hay que optingar de
 *    forma explícita con `ALLOW_DEV_SEED=true`; en `production` se aborta
 *    siempre. Los datos son de prueba y nunca deben llegar a una base de
 *    datos real.
 *  - Sin contraseñas por defecto: `SEED_ADMIN_PASSWORD` y
 *    `SEED_PRODUCER_PASSWORD` son obligatorias. El seed NO inventa contraseñas
 *    ni las imprime: si faltan, aborta antes de tocar la base de datos.
 *  - Re-ejecución no destructiva: el `ON CONFLICT` nunca sobrescribe
 *    `password_hash`. Si una cuenta ya existe, se conservan su contraseña y
 *    su estado real; solo se refrescan los datos no sensibles.
 *  - Detección en runtime: si `plots.geom` o su trigger no existen (migración
 *    de PostGIS sin aplicar), el seed NO falla de forma críptica: avisa con un
 *    mensaje claro y omite las parcelas, dejando roles y usuarios sembrados.
 *
 * Este módulo no imprime nada: devuelve un `SeedReport` y el runner de CLI
 * (`scripts/seed.ts`) lo presenta. Así el seed es reutilizable desde tests.
 */
import 'dotenv/config';
import { Pool } from 'pg';
import { assertPasswordPolicy, hashPassword } from '../scripts/lib/password';

interface RoleSeed {
  readonly nombre: string;
  readonly descripcion: string;
}

interface UserSeed {
  readonly id: string;
  readonly nombre_completo: string;
  readonly documento: string;
  readonly correo: string;
  readonly celular: string;
  readonly rol: string;
  /** Variable de entorno con la contraseña de esta cuenta. */
  readonly passwordEnv: string;
}

interface PlotSeed {
  readonly id: string;
  readonly name: string;
  readonly municipality: string;
  readonly department: string;
  /** Polígono GeoJSON (RFC 7946): [lng, lat], anillo cerrado. */
  readonly geojson: string;
}

export interface SeedUserReport {
  readonly correo: string;
  readonly rol: string;
  readonly passwordEnv: string;
  /** La contraseña siempre viene del entorno: el seed no tiene valores por defecto. */
  readonly passwordSource: 'env';
  /**
   * `true` si la cuenta se creó en esta ejecución (la contraseña del entorno
   * quedó aplicada); `false` si la cuenta ya existía (su contraseña se
   * conservó intacta).
   */
  readonly passwordApplied: boolean;
}

export interface SeedPlotReport {
  readonly name: string;
  readonly municipality: string;
  readonly department: string;
  readonly areaHectares: number;
  readonly centroid: string | null;
}

export interface SeedReport {
  readonly database: string;
  readonly schema: string;
  readonly roles: readonly string[];
  readonly users: readonly SeedUserReport[];
  readonly plots: readonly SeedPlotReport[];
  readonly warnings: readonly string[];
}

const ROLES: readonly RoleSeed[] = [
  { nombre: 'administrador', descripcion: 'Administrador de la plataforma AgroConnect' },
  { nombre: 'comprador_b2b', descripcion: 'Comprador empresarial (B2B)' },
  { nombre: 'comprador_b2c', descripcion: 'Comprador final (B2C)' },
  { nombre: 'productor', descripcion: 'Productor agropecuario' },
  { nombre: 'transportista', descripcion: 'Transportista de carga' },
];

const USERS: readonly UserSeed[] = [
  {
    id: '11111111-1111-4111-8111-111111111201',
    nombre_completo: 'Administrador Demo AgroConnect',
    documento: '900000001',
    correo: 'admin@agroconnect.local',
    celular: '3000000001',
    rol: 'administrador',
    passwordEnv: 'SEED_ADMIN_PASSWORD',
  },
  {
    id: '11111111-1111-4111-8111-111111111202',
    nombre_completo: 'Agricultor Demo AgroConnect',
    documento: '900000002',
    correo: 'productor@agroconnect.local',
    celular: '3000000002',
    rol: 'productor',
    passwordEnv: 'SEED_PRODUCER_PASSWORD',
  },
];

/**
 * Cuadrado de `delta` grados alrededor de un centro, en formato GeoJSON.
 * `delta = 0.001` ≈ 222 m por lado en el ecuador (≈ 4.9 ha).
 */
function squarePolygon(lng: number, lat: number, delta: number): string {
  const ring: number[][] = [
    [lng - delta, lat - delta],
    [lng + delta, lat - delta],
    [lng + delta, lat + delta],
    [lng - delta, lat + delta],
    [lng - delta, lat - delta],
  ];
  return JSON.stringify({ type: 'Polygon', coordinates: [ring] });
}

const PLOTS: readonly PlotSeed[] = [
  {
    id: '11111111-1111-4111-8111-111111111301',
    name: 'Lote La Esperanza',
    municipality: 'Salento',
    department: 'Quindío',
    geojson: squarePolygon(-75.487, 4.644, 0.001),
  },
  {
    id: '11111111-1111-4111-8111-111111111302',
    name: 'Lote El Mirador',
    municipality: 'Salento',
    department: 'Quindío',
    geojson: squarePolygon(-75.487, 4.657, 0.001),
  },
  {
    id: '11111111-1111-4111-8111-111111111303',
    name: 'Lote La Cuchilla',
    municipality: 'Pijao',
    department: 'Quindío',
    geojson: squarePolygon(-75.304, 4.636, 0.001),
  },
];

interface PlotGeometrySupport {
  readonly hasGeomColumn: boolean;
  readonly hasSyncTrigger: boolean;
}

/**
 * Resuelve la contraseña de una cuenta sembrada.
 *
 * No hay valor por defecto: una contraseña conocida en el repositorio
 * permitiría tomar el control de `admin@agroconnect.local` en cualquier
 * entorno donde el seed llegara a ejecutarse. Si la variable no está definida,
 * el seed aborta con un mensaje que indica exactamente qué configurar.
 */
function resolvePassword(user: UserSeed): { value: string; source: 'env' } {
  const fromEnv = process.env[user.passwordEnv]?.trim();
  if (!fromEnv) {
    throw new Error(
      `Falta la variable de entorno ${user.passwordEnv} para sembrar la cuenta "${user.correo}". ` +
        'El seed no usa contraseñas por defecto: define esa variable con una contraseña ' +
        'que cumpla la política (mínimo 8 caracteres, con al menos una letra y un número).',
    );
  }
  return { value: fromEnv, source: 'env' };
}

/** Hosts que se consideran una base de datos local de desarrollo. */
const LOCAL_DATABASE_HOSTS: ReadonlySet<string> = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '[::1]',
]);

/** Entornos en los que el seed puede correr sin opt-in explícito. */
const ALLOWED_ENVIRONMENTS: ReadonlySet<string> = new Set(['development', 'test']);

function resolveDatabaseHost(connectionString: string): string | null {
  try {
    return new URL(connectionString).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Guard de entorno del seed.
 *
 * El seed crea una cuenta de administrador. Ejecutarlo por accidente en
 * staging o en previews creaba esa cuenta con una contraseña conocida en el
 * repositorio. Ahora:
 *
 *  - `NODE_ENV=production` aborta siempre (no hay opt-in en producción);
 *  - `ALLOW_DEV_SEED=true` habilita el seed en cualquier otro entorno, de
 *    forma explícita y auditable;
 *  - sin opt-in, solo se admite `development`/`test` contra una base local.
 */
function assertSeedAllowed(connectionString: string): void {
  const nodeEnv = process.env['NODE_ENV'] ?? 'development';

  if (nodeEnv === 'production') {
    throw new Error(
      'El seed de AgroConnect está deshabilitado en producción (NODE_ENV=production). ' +
        'Las cuentas y parcelas de prueba no deben existir en una base de datos real.',
    );
  }

  if (process.env['ALLOW_DEV_SEED'] === 'true') {
    return;
  }

  const host = resolveDatabaseHost(connectionString);
  const environmentAllowed = ALLOWED_ENVIRONMENTS.has(nodeEnv);
  const hostAllowed = host !== null && LOCAL_DATABASE_HOSTS.has(host);

  if (!environmentAllowed || !hostAllowed) {
    throw new Error(
      'El seed de AgroConnect solo se ejecuta en desarrollo o pruebas locales. ' +
        `NODE_ENV="${nodeEnv}" y base de datos "${host ?? 'no determinable'}". ` +
        'Para habilitarlo en otro entorno define ALLOW_DEV_SEED=true de forma explícita ' +
        'y configura SEED_ADMIN_PASSWORD y SEED_PRODUCER_PASSWORD.',
    );
  }
}

async function seedRoles(pool: Pool): Promise<Map<string, string>> {
  const roleIds = new Map<string, string>();

  for (const role of ROLES) {
    const result = await pool.query<{ id: string }>(
      `INSERT INTO roles (id, nombre, descripcion)
       VALUES (gen_random_uuid(), $1, $2)
       ON CONFLICT (nombre) DO UPDATE SET descripcion = EXCLUDED.descripcion
       RETURNING id`,
      [role.nombre, role.descripcion],
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error(`No se pudo sembrar el rol "${role.nombre}".`);
    }
    roleIds.set(role.nombre, row.id);
  }

  return roleIds;
}

async function seedUsers(
  pool: Pool,
  roleIds: ReadonlyMap<string, string>,
): Promise<SeedUserReport[]> {
  const report: SeedUserReport[] = [];

  for (const user of USERS) {
    const roleId = roleIds.get(user.rol);
    if (!roleId) {
      throw new Error(`El rol "${user.rol}" no fue sembrado; no se puede crear "${user.correo}".`);
    }

    const password = resolvePassword(user);
    // Falla temprano (antes de tocar la base de datos) si la contraseña no
    // cumple la política de `Password`.
    assertPasswordPolicy(password.value);
    const passwordHash = await hashPassword(password.value);

    // `ON CONFLICT` NO toca `password_hash`: si la cuenta ya existe, su
    // contraseña se conserva. Re-sembrar no puede revocar un cambio de
    // contraseña hecho por el operador. `xmax = 0` distingue una inserción
    // (contraseña aplicada) de una actualización (contraseña conservada).
    const result = await pool.query<{ id: string; inserted: boolean }>(
      `INSERT INTO users (
         id, nombre_completo, documento, correo, celular, password_hash, rol_id,
         estado, acepta_tratamiento_datos, correo_verificado_en, fecha_registro, actualizado_en
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVO', TRUE, NOW(), NOW(), NOW())
       ON CONFLICT (correo) DO UPDATE SET
         nombre_completo = EXCLUDED.nombre_completo,
         rol_id = EXCLUDED.rol_id,
         estado = 'ACTIVO',
         actualizado_en = NOW()
       RETURNING id, (xmax = 0) AS inserted`,
      [
        user.id,
        user.nombre_completo,
        user.documento,
        user.correo,
        user.celular,
        passwordHash,
        roleId,
      ],
    );

    report.push({
      correo: user.correo,
      rol: user.rol,
      passwordEnv: user.passwordEnv,
      passwordSource: password.source,
      passwordApplied: result.rows[0]?.inserted ?? false,
    });
  }

  return report;
}

async function detectPlotGeometrySupport(pool: Pool): Promise<PlotGeometrySupport> {
  const result = await pool.query<{ has_geom_column: boolean; has_sync_trigger: boolean }>(
    `SELECT
       EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = current_schema()
           AND table_name = 'plots'
           AND column_name = 'geom'
       ) AS has_geom_column,
       EXISTS (
         SELECT 1
         FROM pg_trigger t
         JOIN pg_class c ON c.oid = t.tgrelid
         JOIN pg_namespace n ON n.oid = c.relnamespace
         WHERE n.nspname = current_schema()
           AND c.relname = 'plots'
           AND t.tgname = 'plots_sync_geometry_trigger'
           AND NOT t.tgisinternal
       ) AS has_sync_trigger`,
  );

  const row = result.rows[0];
  return {
    hasGeomColumn: row?.has_geom_column ?? false,
    hasSyncTrigger: row?.has_sync_trigger ?? false,
  };
}

async function seedPlots(
  pool: Pool,
  farmerId: string,
): Promise<{ plots: SeedPlotReport[]; warnings: string[] }> {
  const support = await detectPlotGeometrySupport(pool);
  const warnings: string[] = [];

  if (!support.hasGeomColumn) {
    warnings.push(
      'La columna plots.geom no existe: se omitió el seed de parcelas. ' +
        'Aplica las migraciones de PostGIS (npm run prisma:deploy -w @agroconnect/api) y vuelve a ejecutar el seed.',
    );
    return { plots: [], warnings };
  }

  if (!support.hasSyncTrigger) {
    warnings.push(
      'El trigger plots_sync_geometry_trigger no existe: se omitió el seed de parcelas. ' +
        'Sin él, centroid y area_hectares no se derivan del polígono. ' +
        'Aplica las migraciones de PostGIS y vuelve a ejecutar el seed.',
    );
    return { plots: [], warnings };
  }

  const plots: SeedPlotReport[] = [];

  for (const plot of PLOTS) {
    const result = await pool.query<{ area_hectares: number; centroid: string | null }>(
      `INSERT INTO plots (id, name, municipality, department, farmer_id, geom)
       VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_GeomFromGeoJSON($6::text), 4326))
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         municipality = EXCLUDED.municipality,
         department = EXCLUDED.department,
         farmer_id = EXCLUDED.farmer_id,
         geom = EXCLUDED.geom
       RETURNING area_hectares, ST_AsText(centroid) AS centroid`,
      [plot.id, plot.name, plot.municipality, plot.department, farmerId, plot.geojson],
    );

    const row = result.rows[0];
    plots.push({
      name: plot.name,
      municipality: plot.municipality,
      department: plot.department,
      areaHectares: row?.area_hectares ?? 0,
      centroid: row?.centroid ?? null,
    });
  }

  return { plots, warnings };
}

/**
 * Ejecuta el seed completo y devuelve el reporte de lo que quedó sembrado.
 *
 * @throws Error si falta `DATABASE_URL`, si el entorno no está permitido por
 * el guard, si faltan las contraseñas del entorno o si la base de datos
 * rechaza una operación.
 */
export async function runSeed(): Promise<SeedReport> {
  const connectionString = process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error('DATABASE_URL es obligatoria para ejecutar el seed.');
  }

  assertSeedAllowed(connectionString);

  const schema = process.env['DATABASE_SCHEMA'] ?? 'public';
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) {
    throw new Error(`DATABASE_SCHEMA inválido: "${schema}".`);
  }

  // `pg` no entiende el parámetro `?schema=` de Prisma, así que el schema se
  // fija con `search_path` en la propia conexión.
  const pool = new Pool({
    connectionString,
    options: `-c search_path=${schema}`,
  });

  try {
    const roleIds = await seedRoles(pool);
    const users = await seedUsers(pool, roleIds);

    const producer = users.find((user) => user.rol === 'productor');
    if (!producer) {
      throw new Error('No se sembró el usuario productor; no se pueden crear las parcelas.');
    }

    const farmer = await pool.query<{ id: string }>('SELECT id FROM users WHERE correo = $1', [
      producer.correo,
    ]);
    const farmerRow = farmer.rows[0];
    if (!farmerRow) {
      throw new Error(`No se encontró el usuario "${producer.correo}" para las parcelas.`);
    }

    const { plots, warnings } = await seedPlots(pool, farmerRow.id);

    return {
      database: connectionString.replace(/\/\/[^@]*@/, '//***@'),
      schema,
      roles: ROLES.map((role) => role.nombre),
      users,
      plots,
      warnings,
    };
  } finally {
    await pool.end().catch(() => undefined);
  }
}
