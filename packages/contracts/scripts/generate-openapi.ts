/**
 * Genera packages/contracts/openapi.json desde los esquemas Zod.
 * El artefacto se commitea; `check:drift` verifica que esté al día.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { buildOpenApiDocument } from '../src/openapi';

const outputPath = fileURLToPath(new URL('../openapi.json', import.meta.url));
const document = buildOpenApiDocument();

writeFileSync(outputPath, JSON.stringify(document, null, 2) + '\n', 'utf8');
console.log(`✓ openapi.json generado en ${outputPath}`);
