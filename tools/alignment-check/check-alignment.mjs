#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Verificador de alineación cross-entorno — AgroConnect
//
// Audita que el directorio local, GitHub, Obsidian y Notion manejen los mismos
// hechos canónicos (tools/alignment-check/manifest.json) SIN incongruencias.
// No copia información entre entornos (cada uno tiene su rol): verifica y,
// cuando algo falla, indica exactamente QUÉ entorno actualizar (→ hint).
//
// Uso:
//   node tools/alignment-check/check-alignment.mjs        # local + GitHub + Obsidian
//   node tools/alignment-check/check-alignment.mjs --all  # + Notion (requiere NOTION_AGROCONNECT_TOKEN)
//   node tools/alignment-check/check-alignment.mjs --ci   # solo repo (lo ejecuta el CI)
//   node tools/alignment-check/check-alignment.mjs --json # salida JSON
// ─────────────────────────────────────────────────────────────────────────────
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const manifest = JSON.parse(readFileSync(join(here, 'manifest.json'), 'utf8'));

const args = process.argv.slice(2);
const mode = args.includes('--all') ? 'all' : args.includes('--ci') ? 'ci' : 'local';
const asJson = args.includes('--json');

const results = [];
const record = (env, label, ok, detail = '', hint = '') =>
  results.push({ env, label, ok, detail, hint });

const HINTS = {
  local: 'Actualiza README.md (o el manifiesto) y verifica: node tools/alignment-check/check-alignment.mjs --ci',
  github: 'Corrige el README y llévalo a main vía PR; después: git fetch.',
  obsidian: 'Actualiza la nota correspondiente del vault (AgroConnect/...).',
  notion: 'Añade la nota de actualización en la página de Notion correspondiente.',
  release:
    'Publica la release/tag correspondiente o actualiza github.latestRelease en manifest.json.',
  visibility:
    'Cambia la visibilidad del repositorio o actualiza github.visibility en manifest.json.',
};

function readIfExists(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

function checkText(env, label, text, needles) {
  if (text === null) {
    record(env, label, false, 'fuente no encontrada', HINTS[env]);
    return;
  }
  const missing = needles.filter((n) => !text.includes(n));
  record(env, label, missing.length === 0, missing.length ? `faltan: ${missing.join(' | ')}` : 'ok', HINTS[env]);
}

function expandHome(path) {
  return path.startsWith('~') ? join(homedir(), path.slice(1)) : path;
}

function readNotionToken() {
  if (process.env.NOTION_AGROCONNECT_TOKEN) return process.env.NOTION_AGROCONNECT_TOKEN;
  const envFile = readIfExists(join(repoRoot, '.env'));
  if (!envFile) return null;
  const line = envFile.split('\n').find((l) => l.startsWith('NOTION_AGROCONNECT_TOKEN='));
  return line ? line.split('=').slice(1).join('=').trim() : null;
}

const coreNeedles = [
  manifest.urls.app,
  manifest.urls.api,
  manifest.stack.frontend,
  manifest.stack.backend,
  `${manifest.traceability.rf} RF`,
  `${manifest.traceability.rnf} RNF`,
  `${manifest.traceability.cu} CU`,
  `${manifest.traceability.hu} HU`,
];

const testNeedles = [
  `${manifest.tests.backend} pruebas backend`,
  `${manifest.tests.frontendUnit} pruebas unitarias`,
  `${manifest.tests.e2e} pruebas E2E`,
];

// ── 1) Directorio local ──────────────────────────────────────────────────────
checkText(
  'local',
  `README (${manifest.sources.localReadme})`,
  readIfExists(join(repoRoot, manifest.sources.localReadme)),
  [...coreNeedles, ...testNeedles]
);

// ── 2) GitHub (README en origin/main + API pública) ─────────────────────────
if (mode !== 'ci') {
  try {
    const remoteReadme = execFileSync('git', ['show', manifest.sources.githubReadme], {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    checkText('github', `README (${manifest.sources.githubReadme})`, remoteReadme, [
      ...coreNeedles,
      ...testNeedles,
    ]);
  } catch {
    record(
      'github',
      `README (${manifest.sources.githubReadme})`,
      false,
      'ref remota no disponible (¿fetch pendiente?)',
      HINTS.github
    );
  }

  if (manifest.github?.repoApi) {
    try {
      const headers = { 'User-Agent': 'agroconnect-alignment-check' };
      const repoRes = await fetch(manifest.github.repoApi, { headers });
      if (repoRes.ok) {
        const repo = await repoRes.json();
        record(
          'github',
          'API: visibilidad del repositorio',
          repo.visibility === manifest.github.visibility,
          `actual: ${repo.visibility} · esperado: ${manifest.github.visibility}`,
          HINTS.visibility
        );
      } else {
        record('github', 'API: visibilidad del repositorio', false, `HTTP ${repoRes.status}`);
      }
      const relRes = await fetch(`${manifest.github.repoApi}/releases/latest`, { headers });
      if (relRes.ok) {
        const rel = await relRes.json();
        record(
          'github',
          'API: última release',
          rel.tag_name === manifest.github.latestRelease,
          `actual: ${rel.tag_name} · esperado: ${manifest.github.latestRelease}`,
          HINTS.release
        );
      } else {
        record('github', 'API: última release', false, `HTTP ${relRes.status}`);
      }
    } catch (error) {
      record('github', 'API de GitHub', false, `red: ${String(error).slice(0, 60)}`);
    }
  }

  // ── 3) Obsidian (notas clave del vault) ────────────────────────────────────
  const vault = expandHome(manifest.sources.obsidianVault);
  if (existsSync(vault)) {
    for (const note of manifest.sources.obsidianNotes) {
      checkText('obsidian', note, readIfExists(join(vault, note)), coreNeedles);
    }
  } else {
    record('obsidian', vault, false, 'vault no encontrado');
  }
}

// ── 4) Notion (PT-OPS-01 + root) ─────────────────────────────────────────────
if (mode === 'all') {
  const token = readNotionToken();
  if (!token) {
    record('notion', 'token NOTION_AGROCONNECT_TOKEN', false, 'no disponible');
  } else {
    for (const [label, pageId] of [
      ['PT-OPS-01 (guía de equipo)', manifest.urls.notionOpsPage],
      ['Root del proyecto', manifest.urls.notionRoot],
    ]) {
      try {
        const response = await fetch(
          `https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`,
          { headers: { Authorization: `Bearer ${token}`, 'Notion-Version': '2022-06-28' } }
        );
        if (!response.ok) {
          record('notion', label, false, `HTTP ${response.status}`);
          continue;
        }
        const payload = await response.text();
        const needles = label.startsWith('PT-OPS')
          ? [manifest.urls.app, manifest.urls.api]
          : [manifest.urls.app];
        checkText('notion', label, payload, needles);
      } catch (error) {
        record('notion', label, false, `error de red: ${String(error).slice(0, 80)}`);
      }
    }
  }
}

// ── Salida ───────────────────────────────────────────────────────────────────
const failed = results.filter((r) => !r.ok);

if (asJson) {
  console.log(JSON.stringify({ mode, total: results.length, failed: failed.length, results }, null, 2));
} else {
  const byEnv = new Map();
  for (const r of results) {
    if (!byEnv.has(r.env)) byEnv.set(r.env, []);
    byEnv.get(r.env).push(r);
  }
  console.log(`\n🧭 Verificación de alineación — AgroConnect (modo: ${mode})\n`);
  for (const [env, items] of byEnv) {
    console.log(`  [${env.toUpperCase()}]`);
    for (const item of items) {
      console.log(`   ${item.ok ? '✅' : '❌'} ${item.label}${item.detail ? ` — ${item.detail}` : ''}`);
      if (!item.ok && item.hint) console.log(`      → ${item.hint}`);
    }
  }
  if (failed.length === 0) {
    console.log('\n🎉 Todos los entornos alineados con el manifiesto\n');
  } else {
    const envs = [...new Set(failed.map((f) => f.env.toUpperCase()))].join(' · ');
    console.log(`\n⚠️ ${failed.length} desalineación(es) detectada(s) → revisar: ${envs}`);
    console.log('   Cada ❌ indica arriba el entorno y el archivo a actualizar.\n');
  }
}

process.exit(failed.length === 0 ? 0 : 1);
