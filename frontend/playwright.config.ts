import { defineConfig, devices } from '@playwright/test';

const BACKEND_URL = 'http://localhost:4100';
const FRONTEND_URL = 'http://localhost:5173';
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://agroconnect:agroconnect_dev@localhost:5434/agroconnect_test?schema=public';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: FRONTEND_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm --prefix ../backend run dev',
      url: `${BACKEND_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        NODE_ENV: 'test',
        PORT: '4100',
        DATABASE_URL: TEST_DATABASE_URL,
        RATE_LIMIT_MAX_ATTEMPTS: '100',
        LOG_LEVEL: 'fatal',
        JWT_ACCESS_SECRET: 'e2e_access_secret_with_at_least_32_characters_ok',
        JWT_REFRESH_SECRET: 'e2e_refresh_secret_with_at_least_32_characters_ok',
      },
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        VITE_API_URL: BACKEND_URL,
      },
    },
  ],
});
