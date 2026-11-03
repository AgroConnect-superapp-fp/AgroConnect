#!/usr/bin/env node
/**
 * Inserta en el root de Notion la nota de estado de Jira.
 *
 * El MCP local no expone `patch-block-children` en esta sesión; el token ya
 * está disponible para `check-alignment.mjs`. El script lo lee del entorno o
 * del `.env` raíz y nunca lo imprime.
 *
 * Uso: node scripts/notion-add-jira-note.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');
const PAGE_ID = '1d7bdc33f29483caadf20189d8ee9b19';
const NOTE =
  'Estado Jira (2026-11-02): el sitio agroconnect.atlassian.net está suspendido (Page Unavailable). El tablero operativo se gestiona temporalmente en GitHub Issues/Projects; el enlace se actualizará cuando exista un sitio nuevo.';

function readNotionToken() {
  if (process.env.NOTION_AGROCONNECT_TOKEN) {
    return process.env.NOTION_AGROCONNECT_TOKEN.trim();
  }

  try {
    const env = readFileSync(resolve(repoRoot, '.env'), 'utf8');
    const line = env
      .split('\n')
      .find((row) => row.startsWith('NOTION_AGROCONNECT_TOKEN='));
    if (!line) return undefined;
    return line
      .slice('NOTION_AGROCONNECT_TOKEN='.length)
      .trim()
      .replace(/^"|"$/g, '');
  } catch {
    return undefined;
  }
}

const token = readNotionToken();
if (!token) {
  console.error('Falta NOTION_AGROCONNECT_TOKEN (entorno o .env).');
  process.exit(1);
}

const response = await fetch(`https://api.notion.com/v1/blocks/${PAGE_ID}/children`, {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ type: 'text', text: { content: NOTE } }],
        },
      },
    ],
  }),
});

if (!response.ok) {
  console.error('Notion respondió', response.status, await response.text());
  process.exit(1);
}

console.log('Nota de Jira añadida al root de Notion.');
