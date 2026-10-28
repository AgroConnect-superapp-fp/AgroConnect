/**
 * Evidencia de la sesión por cookie httpOnly del API NestJS.
 * Uso: node scripts/evidence-session.mjs
 */
const BASE = process.env.BASE_URL ?? 'http://localhost:4100';

const post = async (path, body, cookie) => {
  const headers = { 'Content-Type': 'application/json' };
  if (cookie) headers.cookie = cookie;

  const response = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const setCookie = response.headers.getSetCookie?.() ?? [];
  return { status: response.status, setCookie, body: await response.json().catch(() => null) };
};

const payload = {
  nombre: 'Ana Evidencia',
  documento: `10${Math.floor(1000000 + Math.random() * 8999999)}`,
  correo: `evidencia.${Date.now()}@agroconnect.co`,
  celular: `3${Math.floor(100000000 + Math.random() * 899999999)}`,
  password: 'ClaveSegura1',
  rol: 'productor',
  finca: { nombre: 'Finca La Esperanza', municipio: 'Armenia', vereda: 'El Progreso' },
  aceptaTratamientoDatos: true,
};

const registro = await post('/api/v1/auth/register', payload);
console.log('── REGISTRO ──');
console.log('status:', registro.status);
for (const cookie of registro.setCookie) console.log('set-cookie:', cookie);

const login = await post('/api/v1/auth/login', {
  correo: payload.correo,
  password: payload.password,
});
console.log('\n── LOGIN ──');
console.log('status:', login.status);
for (const cookie of login.setCookie) console.log('set-cookie:', cookie);

const cookieHeader = login.setCookie.map((cookie) => cookie.split(';')[0]).join('; ');

const refresh = await post('/api/v1/auth/refresh', {}, cookieHeader);
console.log('\n── REFRESH (token solo en la cookie, sin cuerpo) ──');
console.log('status:', refresh.status);
for (const cookie of refresh.setCookie) console.log('set-cookie:', cookie);

const logout = await post('/api/v1/auth/logout', {}, cookieHeader);
console.log('\n── LOGOUT ──');
console.log('status:', logout.status);
for (const cookie of logout.setCookie) console.log('set-cookie:', cookie);
