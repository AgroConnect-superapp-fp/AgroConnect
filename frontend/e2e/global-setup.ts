import { execSync } from 'node:child_process';

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://agroconnect:agroconnect_dev@localhost:5434/agroconnect_test?schema=public';

/**
 * Siembra idempotente de propiedades demo en la base de test.
 *
 * Los E2E de marketplace e imágenes dependen de esas propiedades y la base se
 * limpia entre sesiones con `test:reset-db`; la suite se autoabastece en cada
 * corrida para que `npx playwright test` funcione sobre una base recién limpia.
 */
export default function globalSetup(): void {
  execSync('npm --prefix ../apps/api run seed:products', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test', DATABASE_URL: TEST_DATABASE_URL },
  });
}
