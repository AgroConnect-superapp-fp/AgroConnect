import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://agroconnect:agroconnect_dev@localhost:5434/agroconnect_test?schema=public';

const API_DIR = fileURLToPath(new URL('../../apps/api', import.meta.url));

/** Aborta si la URL no apunta a una base terminada en `_test`. */
function assertTestDatabase(connectionString: string): void {
  const database = new URL(connectionString).pathname.replace(/^\//, '');

  if (!database.endsWith('_test')) {
    throw new Error(
      `globalSetup: la base "${database}" no es de test (debe terminar en _test); se aborta la siembra.`
    );
  }
}

/**
 * Siembra idempotente de propiedades demo en la base de test.
 *
 * Los E2E de marketplace e imágenes dependen de esas propiedades y la base se
 * limpia entre sesiones con `test:reset-db`; la suite se autoabastece en cada
 * corrida para que `npx playwright test` funcione sobre una base recién limpia.
 */
export default function globalSetup(): void {
  assertTestDatabase(TEST_DATABASE_URL);

  execFileSync('npm', ['run', 'seed:products'], {
    cwd: API_DIR,
    stdio: 'inherit',
    timeout: 120_000,
    env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: TEST_DATABASE_URL },
  });
}
