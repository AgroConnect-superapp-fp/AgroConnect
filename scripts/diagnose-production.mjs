#!/usr/bin/env node
/**
 * Diagnóstico de producción — AgroConnect
 *
 * Comprueba, sin credenciales ni escrituras:
 *  1. Frontend Vercel (200 + CSP).
 *  2. API liveness (/health).
 *  3. API readiness (/health/ready → 200 si la DB responde; 503 si no).
 *  4. Preflight CORS desde el origen real.
 *  5. CSRF: POST sin cabecera → 403.
 *  6. Login con un correo inexistente → 401 si la DB responde; 500 si está caída.
 *  7. DNS del proyecto Supabase usado por el marketplace.
 *
 * No crea usuarios ni modifica datos. Uso:
 *   node scripts/diagnose-production.mjs
 */
import { promises as dns } from 'node:dns';

const APP = 'https://agroconnectpreview.vercel.app';
const API = 'https://agroconnect-api-5t7n.onrender.com';
const SUPABASE_HOST = 'fwmaehhzfydbhilpfbrl.supabase.co';
const TIMEOUT_MS = 45_000;

const results = [];
const record = (name, ok, detail) => results.push({ name, ok, detail });

async function request(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function checkFrontend() {
  try {
    const response = await request(APP, { redirect: 'manual' });
    const csp = response.headers.get('content-security-policy');
    record('Vercel /', response.status === 200, `HTTP ${response.status}`);
    record('Vercel CSP', Boolean(csp), csp ? 'presente' : 'ausente');
    record(
      'Vercel X-Frame-Options',
      response.headers.get('x-frame-options') === 'DENY',
      response.headers.get('x-frame-options') ?? 'ausente'
    );
  } catch (error) {
    record('Vercel /', false, String(error));
  }
}

async function checkApi() {
  try {
    const health = await request(`${API}/health`);
    record('API /health (liveness)', health.status === 200, `HTTP ${health.status}`);
  } catch (error) {
    record('API /health (liveness)', false, String(error));
  }

  try {
    const ready = await request(`${API}/health/ready`);
    record(
      'API /health/ready (DB)',
      ready.status === 200,
      ready.status === 200 ? 'HTTP 200 · DB up' : `HTTP ${ready.status} · DB down o schema ausente`
    );
  } catch (error) {
    record('API /health/ready (DB)', false, String(error));
  }
}

async function checkCorsAndCsrf() {
  try {
    const preflight = await request(`${API}/api/v1/auth/login`, {
      method: 'OPTIONS',
      headers: {
        Origin: APP,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'x-requested-with,content-type',
      },
    });
    const allowOrigin = preflight.headers.get('access-control-allow-origin');
    const allowHeaders = preflight.headers.get('access-control-allow-headers') ?? '';
    record('CORS preflight', preflight.status === 204, `HTTP ${preflight.status}`);
    record('CORS origen permitido', allowOrigin === APP, allowOrigin ?? 'ausente');
    record(
      'CORS X-Requested-With',
      allowHeaders.toLowerCase().includes('x-requested-with'),
      allowHeaders || 'ausente'
    );
  } catch (error) {
    record('CORS preflight', false, String(error));
  }

  try {
    const withoutCsrf = await request(`${API}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    record('CSRF sin cabecera', withoutCsrf.status === 403, `HTTP ${withoutCsrf.status}`);
  } catch (error) {
    record('CSRF sin cabecera', false, String(error));
  }
}

async function checkLogin() {
  try {
    const response = await request(`${API}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: APP,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({
        correo: 'diagnostico@example.com',
        password: 'ClaveSegura1',
      }),
    });
    // 401 = la DB respondió y el usuario no existe (correcto).
    // 500 = la DB/schema no responde.
    record(
      'Login con correo inexistente',
      response.status === 401,
      response.status === 401
        ? 'HTTP 401 · DB operativa'
        : `HTTP ${response.status} · revisar DB (esperado 401)`
    );
  } catch (error) {
    record('Login con correo inexistente', false, String(error));
  }
}

async function checkSupabaseDns() {
  try {
    const addresses = await dns.resolve4(SUPABASE_HOST);
    record('DNS Supabase', addresses.length > 0, addresses.join(', '));
  } catch (error) {
    record(
      'DNS Supabase',
      false,
      `${error.code ?? 'ERROR'} · el proyecto puede estar pausado o eliminado`
    );
  }
}

async function main() {
  await Promise.all([
    checkFrontend(),
    checkApi(),
    checkCorsAndCsrf(),
    checkLogin(),
    checkSupabaseDns(),
  ]);

  const failures = results.filter((result) => !result.ok);
  console.log('\nDiagnóstico de producción — AgroConnect\n');
  for (const result of results) {
    console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.name.padEnd(30)} ${result.detail}`);
  }
  console.log(
    `\n${results.length - failures.length}/${results.length} comprobaciones OK · ${failures.length} fallo(s)\n`
  );

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Error inesperado:', error);
  process.exitCode = 1;
});
