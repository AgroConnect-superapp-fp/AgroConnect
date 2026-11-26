import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      // La composición de rutas se cubre en E2E (deep links y guardas); el
      // umbral unitario mide lógica y UI, no el cableado de `screenRoutes`.
      exclude: ['src/app/screenRoutes.tsx'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
