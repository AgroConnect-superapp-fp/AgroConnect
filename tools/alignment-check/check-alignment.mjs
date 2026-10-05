#!/usr/bin/env node
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

function record(env, label, ok, detail) {
  results.push({ env, label, ok, detail: detail ?? '' });
}

function readIfExists(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

function missingNeedles(text, needles) {
  return needles.filter((needle) => !text.includes(needle));
}

function checkText(env, label, text, needles) {
  if (text === null) {
    record(env, label, false, 'fuente no encontrada');
    return;
  }
  const missing = missingNeedles(text, needles);
  record(env, label, missing.length === 0, missing.length ? `faltan: ${missing.join(' | ')}` : 'ok');
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

const localReadme = readIfExists(join(repoRoot, manifest.sources.localReadme));
checkText('local', `README (${manifest.sources.localReadme})`, localReadme, [...coreNeedles, ...testNeedles]);

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
    record('github', `README (${manifest.sources.githubReadme})`, false, 'ref remota no disponible (¿fetch pendiente?)');
  }

  const vault = expandHome(manifest.sources.obsidianVault);
  if (existsSync(vault)) {
    for (const note of manifest.sources.obsidianNotes) {
      const text = readIfExists(join(vault, note));
      checkText('obsidian', note, text, coreNeedles);
    }
  } else {
    record('obsidian', vault, false, 'vault no encontrado');
  }
}

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
        const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children?page_size=100`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Notion-Version': '2022-06-28',
          },
        });
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
    }
  }
  console.log(
    `\n${failed.length === 0 ? '🎉 Todos los entornos alineados con el manifiesto' : `⚠️ ${failed.length} desalineación(es) detectada(s)`}\n`
  );
}

process.exit(failed.length === 0 ? 0 : 1);
