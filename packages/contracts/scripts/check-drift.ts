/**
 * Verifica que openapi.json commiteado coincida con los esquemas Zod actuales.
 * Falla (exit 1) si el artefacto está desactualizado: el CI bloquea el merge.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildOpenApiDocument } from '../src/openapi';

/** Serialización estable: claves ordenadas para comparar contenido, no formato. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value) ?? 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(',')}}`;
}

const committedPath = fileURLToPath(new URL('../openapi.json', import.meta.url));

let committed: unknown;
try {
  committed = JSON.parse(readFileSync(committedPath, 'utf8')) as unknown;
} catch {
  console.error('✗ Drift: openapi.json no existe o no es JSON válido. Ejecuta: npm run generate:openapi');
  process.exit(1);
}

const generated = buildOpenApiDocument();

if (stableStringify(committed) !== stableStringify(generated)) {
  console.error('✗ Drift detectado: openapi.json no coincide con los esquemas Zod actuales.');
  console.error('  Ejecuta: npm run generate:openapi (en packages/contracts) y commitea el resultado.');
  process.exit(1);
}

console.log('✓ openapi.json sincronizado con los esquemas Zod (sin drift)');
