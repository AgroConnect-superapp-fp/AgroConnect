import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { E2E_ADMIN } from './fixtures';

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
 * Siembra idempotente de propiedades demo y de la cuenta administradora en la
 * base de test.
 *
 * Los E2E de marketplace, imágenes y accesibilidad de moderación dependen de
 * esos datos y la base se limpia entre sesiones con `test:reset-db`; la suite
 * se autoabastece en cada corrida para que `npx playwright test` funcione
 * sobre una base recién limpia.
 */
export default function globalSetup(): void {
  assertTestDatabase(TEST_DATABASE_URL);

  const env = { ...process.env, NODE_ENV: 'test', DATABASE_URL: TEST_DATABASE_URL };

  execFileSync('npm', ['run', 'seed:products'], {
    cwd: API_DIR,
    stdio: 'inherit',
    timeout: 120_000,
    env,
  });

  execFileSync('npm', ['run', 'seed:e2e-admin'], {
    cwd: API_DIR,
    stdio: 'inherit',
    timeout: 120_000,
    env: {
      ...env,
      E2E_ADMIN_EMAIL: E2E_ADMIN.email,
      E2E_ADMIN_PASSWORD: E2E_ADMIN.password,
      E2E_ADMIN_NAME: E2E_ADMIN.fullName,
    },
  });
}
