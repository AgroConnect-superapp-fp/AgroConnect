#!/usr/bin/env node
/**
 * Genera el service worker final DESPUÉS de que Vite escribe `dist`.
 *
 * Workbox usa glob@11 internamente y ese glob no resuelve correctamente los
 * assets en este entorno (solo encuentra los iconos de public/). En vez de
 * depender del glob, enumeramos los archivos con Node y pasamos
 * `additionalManifestEntries` explícitos.
 */
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateSW } from 'workbox-build';

const DIST = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const CACHEABLE_EXTENSIONS = /\.(js|css|html|svg|png|ico|woff2?)$/i;
const IGNORED = /(^|\/)(sw(-[^/]+)?\.js|workbox-[^/]+\.js)$/;

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const files = (await listFiles(DIST)).filter(
    (file) => CACHEABLE_EXTENSIONS.test(file) && !IGNORED.test(file)
  );

  const additionalManifestEntries = await Promise.all(
    files.map(async (file) => {
      const content = await readFile(file);
      const fileStat = await stat(file);
      return {
        url: `/${relative(DIST, file).split(sep).join('/')}`,
        revision: `${fileStat.size}-${createHash('sha256').update(content).digest('hex').slice(0, 16)}`,
      };
    })
  );

  if (!additionalManifestEntries.some((entry) => entry.url === '/index.html')) {
    throw new Error(
      'No se encontró index.html en dist; el SW no puede precachear el shell.'
    );
  }

  const result = await generateSW({
    globDirectory: DIST,
    globPatterns: [],
    additionalManifestEntries,
    swDest: join(DIST, 'sw.js'),
    navigateFallback: '/index.html',
    cleanupOutdatedCaches: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'cloudinary-images',
          expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern:
          /^https:\/\/([a-d]\.)?(tile\.openstreetmap\.org|tile\.opentopomap\.org|basemaps\.cartocdn\.com)\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'map-tiles',
          expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 7 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  });

  console.log(
    `PWA final: ${result.count} entradas precacheadas (${(totalBytes / 1024).toFixed(1)} KiB).`
  );
  for (const warning of result.warnings) {
    console.warn(`Workbox warning: ${warning}`);
  }
}

main().catch((error) => {
  console.error('No fue posible generar el service worker final:', error);
  process.exitCode = 1;
});
