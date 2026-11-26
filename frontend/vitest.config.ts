import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      // El umbral mide lógica crítica: servicios, API, hooks, routing, guards,
      // tipos y utilidades. Las pantallas y la composición de rutas se cubren
      // con E2E; `screenRoutes` y los hooks de Leaflet/upload quedan fuera.
      include: [
        'src/services/**/*.ts',
        'src/shared/**/*.ts',
        'src/hooks/**/*.ts',
        'src/app/routing.ts',
        'src/app/guards.tsx',
        'src/types/**/*.ts',
        'src/utils/**/*.ts',
      ],
      exclude: [
        'src/**/*.test.*',
        'src/hooks/useLeafletDraw.ts',
        'src/hooks/useImageUpload.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
