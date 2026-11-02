# Guía de ejecución, uso y despliegue — AgroConnect

> Documento operativo del proyecto. Estado vigente: **2026-11-02**, tras la
> auditoría integral y el cutover de producción a NestJS (`apps/api`).

## 1. Aplicación en producción

- **URL:** https://agroconnectpreview.vercel.app
- **Proyecto Vercel:** `agro-connect/agroconnectpreview` (Root Directory `frontend`)
- **Repo:** `AgroConnect-superapp-fp/AgroConnect` (público, organización)
- **API:** https://agroconnect-api-5t7n.onrender.com (`GET /health` → 200)
- **Base de datos:** PostgreSQL de Supabase, esquema `agroconnect`

### Qué funciona en producción

- **Registro e inicio de sesión reales** contra `apps/api` (NestJS 11).
- **Sesión cookie-only:** access y refresh en cookies `httpOnly`; el cuerpo de
  auth solo devuelve `usuario`.
- **Acceso de demostración** («Explorar la demo»): entra al mercado sin registro.
- Marketplace (mapa Leaflet + productores destacados) con datos de Supabase.
- Imágenes por cultivo, fallback automático (`SafeImage`), LQIP y créditos.
- Si Supabase no responde: datos de demostración con aviso y botón de reintento.
- **PWA:** implementada con `vite-plugin-pwa`: manifest, iconos 192/512/maskable,
  precache del shell y caché de imágenes de Cloudinary y tiles del mapa.

### Backend de producción (`apps/api`, NestJS)

- **Build en Render:** desde la raíz del monorepo,
  `npm ci --include=dev && npm run build -w @agroconnect/contracts &&
  npm run prisma:generate -w @agroconnect/api && npm run build -w @agroconnect/api`.
- **Start:** `npm run start -w @agroconnect/api` (`node dist/main.js`).
- **Salud:** `/health` (liveness, no toca la DB) y `/health/ready`
  (readiness: `SELECT 1`; 200 si la DB responde, 503 si no).
- **Runtime:** Prisma 7 con driver adapter exige `DATABASE_SCHEMA` explícito
  (ignora el `?schema=` de la URL). En Render: `agroconnect`.
- **Migraciones:** `cd apps/api && DATABASE_URL="<supabase-url>" npx prisma migrate deploy`.
- **Proxy:** `TRUST_PROXY=1` para que `req.ip` sea la IP real detrás de Render.
- **Rate limit:** `RATE_LIMIT_MAX_ATTEMPTS=10` por ventana de 15 min.
- **Cookies:** `SameSite=None; Secure` en producción (cross-site Vercel→Render),
  access en `Path=/api/v1` y refresh en `Path=/api/v1/auth`.
- **CSRF:** `CsrfGuard` exige `Origin`/`Referer` permitido y
  `X-Requested-With: XMLHttpRequest` en métodos mutantes.
- **Sesión:** refresh token con familia/generación (reuso revoca la familia),
  Argon2id con rehash desde bcrypt y verificación de correo obligatoria.
- **JWT:** `JWT_ISSUER`/`JWT_AUDIENCE`; los tokens sin `iss`/`aud` se rechazan.
- **Correo:** con `SMTP_HOST` configurado se usa SMTP real; sin él, los correos
  se escriben en `MAIL_DIR` (solo desarrollo/pruebas).

> Free tier: el servicio se suspende tras ~15 min de inactividad (despierta en
> ~1 min con la primera petición). El cold start puede superar los 20 s.

## 2. Requisitos del sistema (equipo)

| Componente | Versión / nota |
|---|---|
| Node.js | 24 LTS (`.nvmrc`); CI y Render usan 24 |
| npm | 12.x (workspaces + Turborepo) |
| PostgreSQL | 16 + PostGIS 3.4 (Docker: `postgis/postgis:16-3.4`) |
| Docker + Compose | Base de datos local de desarrollo y pruebas |
| Navegador | Chromium/Chrome actualizado (Leaflet) |
| Cuentas | Supabase (marketplace), Cloudinary (imágenes), Vercel, Render, GitHub |

## 3. Ejecución en local

```bash
# 1. Dependencias del monorepo (desde la raíz)
npm ci

# 2. Base de datos (PostGIS en 127.0.0.1:5434)
docker compose up -d

# 3. API NestJS
cd apps/api
cp .env.example .env          # completar DATABASE_URL, JWT_*, DATABASE_SCHEMA
npm run prisma:generate
npm run prisma:deploy
npm run dev                   # http://localhost:4000

# 4. Frontend (otra terminal, desde la raíz)
npm run dev -w agroconnect-frontend   # http://localhost:5173
```

Variables clave del frontend (`frontend/.env.local`):
`VITE_API_URL=http://localhost:4000` (sin `/api/v1`; el cliente añade la ruta).

### Uso básico

1. Abrir el frontend.
   - Demo pública: «Explorar la demo (sin registro)».
   - Local: **Crear cuenta** (roles: productor, comprador B2C/B2B, transportista;
     el administrador se asigna internamente).
2. Iniciar sesión → **Panel** → **Explorar prototipo del mercado**.
3. En el marketplace: mapa interactivo, búsqueda, zonas productivas, galería.

## 4. Despliegue

### Frontend (Vercel)

- Proyecto con **Root Directory `frontend`**, framework Vite, Node 24.x.
- `frontend/vercel.json` construye el monorepo:
  - `installCommand`: `cd .. && npm ci --include=dev`
  - `buildCommand`: `cd .. && npm run build -w @agroconnect/contracts && npm run build -w agroconnect-frontend`
  - `outputDirectory`: `dist` (relativo a `frontend`)
- Variables: `VITE_API_URL`, `VITE_CLOUDINARY_*` y `VITE_SUPABASE_*` en
  **Production** y **Preview** (Preview debe apuntar al API de staging o al
  mismo API si no hay staging).
- Cabeceras: CSP, XFO, XCTO, Referrer-Policy, Permissions-Policy y HSTS en
  ambos `vercel.json` (raíz y `frontend/`).

Despliegue manual (si el CI no lo hace). **Ejecutar siempre desde la raíz del repo**:

```bash
npx vercel deploy --prod --yes --archive=tgz
```

- El proyecto Vercel tiene Root Directory `frontend`, pero el build necesita el
  monorepo completo (contratos). Desplegar desde `frontend` sube solo esa
  carpeta y `cd ..` no encuentra el `package.json` raíz; por eso el comando va
  desde la raíz.
- **Preview validado (2026-11-02):**
  `https://agroconnectpreview-kchv56jw2-agro-connect.vercel.app` → READY, HTTP
  200 con CSP, XCTO, XFO, Referrer-Policy, Permissions-Policy y HSTS.
- `--archive=tgz` evita el cuelgue de subida del CLI con muchos archivos.

### Backend (Render)

- Blueprint `render.yaml` con `rootDir: .`, build del monorepo y start de
  `@agroconnect/api`.
- Variables sensibles (`DATABASE_URL`, `SMTP_*`) se configuran en el dashboard.
- El backend legacy `backend/` fue retirado; el único backend es `apps/api`.

### CI/CD

- `CI — AgroConnect` corre API NestJS, frontend, E2E, contratos, alineación
  y CodeQL.
- El job `deploy` es **fail-closed**: si falta `VERCEL_TOKEN`, el pipeline falla
  (no se publica una versión distinta a la validada).
- El job ejecuta `vercel deploy --prod --yes --archive=tgz` **desde la raíz**
  (mismo procedimiento validado en preview).
- Tras merge a `main`: verificar deployment Ready y probar login real.

### Verificación post-deploy

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://agroconnectpreview.vercel.app
curl -s https://agroconnect-api-5t7n.onrender.com/health
curl -sI https://agroconnectpreview.vercel.app | grep -Ei 'content-security|x-frame|x-content-type|referrer|permissions'
curl -sI https://agroconnectpreview.vercel.app/manifest.webmanifest | grep -i content-type
curl -sI https://agroconnectpreview.vercel.app/sw.js | grep -i content-type
```

Además, en el navegador: registrar un usuario, recargar (refresh silencioso),
cerrar sesión y repetir el login. En DevTools → Application → Cookies deben
aparecer `access_token` y `refresh_token` con `HttpOnly`, `Secure` y
`SameSite=None`.

## 5. Problemas conocidos y soluciones

| Síntoma | Causa | Solución |
|---|---|---|
| Deploy CLI "colgado" | Subida de archivos | Usar `--archive=tgz` |
| `prisma migrate deploy` con P3005 | El schema de Supabase ya tiene tablas sin historial | Usar el schema dedicado `agroconnect` y `DATABASE_SCHEMA=agroconnect` |
| P1000 / P1001 | Contraseña/host incorrectos o placeholder sin reemplazar | Resetear la contraseña en Supabase y reconstruir la URL |
| Cold start de ~20 s | Free tier de Render suspende por inactividad | La primera petición despierta el servicio |
| `/health` responde 200 pero login y plots dan 500 | La sonda de liveness no comprueba la DB; Supabase puede estar pausado, con credenciales inválidas o sin el schema `agroconnect` | Revisar `/health/ready` (503 = DB caída), logs de Render por `correlationId` y el dashboard de Supabase |
| 403 `FORBIDDEN` en login/registro | Falta `Origin` permitido o `X-Requested-With` | Verificar `CORS_ORIGIN` y que el cliente envíe el header |
| Cookies no se guardan en el navegador | `SameSite=None` sin `Secure`, o dominio cruzado mal configurado | Servir todo por HTTPS y revisar `Path`/`Secure` |
| Build de Vercel no encuentra `@agroconnect/contracts` | Root Directory `frontend` sin build del monorepo, o despliegue lanzado desde `frontend` (sube solo esa carpeta) | Desplegar desde la raíz; verificar `installCommand`/`buildCommand` de `frontend/vercel.json` |
| `DATABASE_SCHEMA` ignorado | Prisma 7 usa la variable, no `?schema=` | Definir `DATABASE_SCHEMA` en el entorno |
| `.env.local` modificado tras `vercel link` | El CLI añade `VERCEL_OIDC_TOKEN` | Es normal; no afecta las claves `VITE_*` |

## 6. Rollback

1. **Frontend:** en Vercel → Deployments → seleccionar el deployment anterior →
   **Promote to Production**.
2. **Backend:** en Render → seleccionar el deploy anterior → **Redeploy**.
3. **Base de datos:** no revertir migraciones en caliente; restaurar desde el
   backup de Supabase si una migración corrupta lo exige.
4. **Sesiones:** al cambiar atributos de cookie, los usuarios deben iniciar
   sesión de nuevo; es el comportamiento esperado.

## 7. Referencias

- Auditoría integral 2026-11-02: `docs/auditoria-2026-11-02.md`.
- Decisión de sesión: `docs/adr/0010-estrategia-de-sesion.md`.
- Monorepo y contratos: `docs/adr/0015-monorepo-contract-first.md`.
- README del repo: sección **Despliegue**.
