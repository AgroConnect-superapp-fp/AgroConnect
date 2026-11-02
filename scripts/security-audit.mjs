#!/usr/bin/env node
/**
 * Gate de seguridad de AgroConnect (SPEC.md §11 y §13).
 *
 * Política:
 *  - Cualquier vulnerabilidad CRITICAL bloquea el pipeline.
 *  - Cualquier vulnerabilidad HIGH fuera de la allowlist bloquea el pipeline.
 *  - La allowlist contiene únicamente riesgos aceptados y documentados.
 *
 * Uso: node scripts/security-audit.mjs <backend|frontend>
 */
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ALLOWLIST = new Map([
  [
    'GHSA-ggr8-5vv4-36mx',
    'deepmerge-ts (<8) vía Prisma CLI: devDependency sin fix publicado a la fecha (afecta todas las versiones de @prisma/config hasta 8.1.0-dev.4). No se despliega a producción ni procesa entrada de usuario.',
  ],
  [
    'GHSA-vfj7-8cjw-p6xm',
    'braces (<=3.0.3, CVE-2026-93687): DoS por stack exhaustion, publicada 2026-09-18 y sin versión parcheada en npm a la fecha (última: 3.0.3). Presente solo en devDependencies (micromatch/Jest en backend; chokidar/Tailwind en frontend); no se despliega a producción ni procesa entrada de usuario. Revisar al publicarse braces 3.0.4+ o al migrar Jest 30 / Tailwind 4.',
  ],
]);

const project = process.argv[2];
if (!project) {
  console.error('Uso: node scripts/security-audit.mjs <backend|frontend>');
  process.exit(2);
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const cwd = resolve(scriptDir, '..', project);

function auditJson() {
  try {
    return execSync('npm audit --json', { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    if (error.stdout) {
      return error.stdout;
    }
    throw error;
  }
}

const report = JSON.parse(auditJson());
const vulnerabilities = report.vulnerabilities ?? {};
const totals = report.metadata?.vulnerabilities ?? {
  info: 0,
  low: 0,
  moderate: 0,
  high: 0,
  critical: 0,
};

const advisories = new Set();
for (const info of Object.values(vulnerabilities)) {
  for (const via of info.via ?? []) {
    if (typeof via === 'object' && via.url) {
      advisories.add(via.url.split('/').pop());
    }
  }
}

const blockedAdvisories = [...advisories].filter((id) => !ALLOWLIST.has(id));
const hasCritical = totals.critical > 0;

console.log(`Auditoría de seguridad — ${project}`);
console.log(
  `  Totales: ${totals.critical} críticas · ${totals.high} altas · ${totals.moderate} moderadas · ${totals.low} bajas`,
);

for (const [id, reason] of ALLOWLIST) {
  if (advisories.has(id)) {
    console.log(`  Allowlist: ${id} — ${reason}`);
  }
}

if (hasCritical) {
  console.error(`\nFALLO: ${totals.critical} vulnerabilidad(es) crítica(s) detectada(s).`);
  process.exit(1);
}

if (blockedAdvisories.length > 0) {
  console.error(
    `\nFALLO: vulnerabilidades altas sin allowlist: ${blockedAdvisories.join(', ')}`,
  );
  process.exit(1);
}

console.log('\nOK: sin vulnerabilidades críticas y sin altas fuera de la allowlist.');
