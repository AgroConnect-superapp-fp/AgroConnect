/**
 * Smoke test del build de producción.
 *
 * `vite dev` y `vite preview` no comparten el grafo de chunks: un plugin UMD
 * puede ejecutarse antes de `window.L` en producción aunque en desarrollo
 * funcione. Este script sirve `dist/`, navega las rutas críticas y falla si la
 * app queda en blanco o lanza un error de página.
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from '@playwright/test';

const PORT = 4174;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const ROUTES = ['/', '/marketplace'];

const require = createRequire(import.meta.url);
const viteBin = join(dirname(require.resolve('vite/package.json')), 'bin/vite.js');

const server = spawn(
  process.execPath,
  [viteBin, 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  { stdio: 'inherit' }
);

async function waitForServer() {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      const response = await fetch(BASE_URL);
      if (response.ok) return;
    } catch {
      // El servidor aún no levantó.
    }
    await delay(250);
  }
  throw new Error('vite preview no respondió a tiempo');
}

async function main() {
  await waitForServer();
  const browser = await chromium.launch({ headless: true });

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
      await page.waitForFunction(
        () => (document.querySelector('#root')?.textContent ?? '').trim().length > 0,
        undefined,
        { timeout: 10_000 }
      );

      if (errors.length > 0) {
        throw new Error(`${route} lanzó errores de página: ${errors.join(' | ')}`);
      }

      const heading = await page.locator('h1').first().textContent();
      console.log(`✓ ${route} renderiza "${heading?.trim() ?? 'sin h1'}"`);
      await page.close();
    }
  } finally {
    await browser.close();
    server.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  server.kill('SIGTERM');
  process.exitCode = 1;
});
