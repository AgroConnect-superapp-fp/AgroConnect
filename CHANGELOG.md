# Changelog — AgroConnect

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [1.1.0] — 2026-11-02

### Seguridad

- **Auto-registro como administrador bloqueado:** el esquema de registro y el caso de
  uso solo aceptan roles auto-registrables (`ROLE_NOT_ALLOWED`, 403); la pantalla de
  selección de rol ya no ofrece "Administrador".
- **Rate limiting real detrás del proxy de Render:** `trust proxy` configurable
  (`TRUST_PROXY`, 1 en Render) y un limitador independiente por ruta, ahora también en
  `/register` y `/refresh`.
- **Tokens de un solo uso atómicos:** la rotación del refresh token y el consumo de
  los enlaces de recuperación y verificación ya no admiten reutilización concurrente.
- **JWT con algoritmo fijado** (`HS256`) al firmar y verificar.
- **Violaciones de unicidad** en el registro concurrente responden 409 en lugar de 500.
- **XSS en la búsqueda del mapa:** los resultados de `leaflet-geosearch` se escapan
  antes de insertarse con `innerHTML`.
- `CORS_ORIGIN` de producción sin `localhost`.

### Añadido

- **Monorepo npm workspaces + Turborepo** (ADR-015): `apps/*`, `backend/`,
  `frontend/`, `packages/contracts` y `packages/config`, con lockfile único y
  build cacheado.
- **Núcleo NestJS 11** (`apps/api`, ADR-009): identidad y geografía migradas
  desde Express, con pruebas de integración contra PostgreSQL/PostGIS.
- **Contratos compartidos** (`@agroconnect/contracts`): esquemas Zod y OpenAPI
  con verificación de drift en CI.
- **Sesión cookie-only** en el frontend: access y refresh en cookies
  `httpOnly`; ningún token en JavaScript.
- **CSRF de despliegue cross-site**: `CsrfGuard` valida `Origin`/`Referer`
  contra `CORS_ORIGIN` y exige `X-Requested-With: XMLHttpRequest`.
- **Cookies endurecidas**: `SameSite=None; Secure` en producción, access en
  `Path=/api/v1` y refresh en `Path=/api/v1/auth`.
- **Cabeceras de seguridad en Vercel**: CSP, `X-Frame-Options`,
  `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` y HSTS.
- **Auditoría integral 2026-11-02** (`docs/auditoria-2026-11-02.md`) y scripts
  reproducibles de auditoría de administradores y RLS de Supabase.
- **Readiness real** (`GET /health/ready`): ejecuta `SELECT 1` y devuelve 503
  si la base no responde; `/health` queda como liveness sin tocar la DB.
- **Diagnóstico de producción** (`scripts/diagnose-production.mjs`,
  `npm run diagnose:prod`): Vercel, liveness, readiness, CORS, CSRF, login y
  DNS de Supabase, con exit code 1 si algo falla.
- **Runbook de recuperación** (`docs/runbook-recuperacion-supabase.md`):
  reactivar/crear el proyecto, actualizar el pooler, migrar, verificar RLS y
  cookies.
- **D2 — retiro del backend legacy:** `backend/` eliminado; Prisma movido a
  `apps/api/prisma`; CI, rulesets y documentación con un único backend.
- **PWA real** con `vite-plugin-pwa`: manifest, iconos 192/512/maskable, precache
  del shell y caché de imágenes Cloudinary/tiles; gate de CI que verifica
  `manifest.webmanifest`, `sw.js` y `registerSW.js`.
- **`scripts/` y `docs/` versionados** en el repositorio (antes ignorados).
- **ADR-016** con las decisiones pendientes del siguiente ciclo (PWA, retiro
  del legacy, refresh/Argon2id, verificación de correo, release).
- **Logger de desarrollo** (`devLog`): las 27 trazas de debug del frontend ya
  no se emiten en el bundle de producción.
- **Test de `trust proxy`** para el rate limiting detrás del proxy de Render.

### Cambiado

- **Producción pasa a `apps/api` (NestJS)**: `render.yaml` construye el
  monorepo, genera Prisma y arranca `@agroconnect/api`; el backend Express
  queda como legado en retiro.
- **El cuerpo de las respuestas de auth ya no incluye tokens** (solo
  `usuario`); las cookies httpOnly son la única vía de sesión.
- **Vercel**: build del monorepo (contratos + frontend) desde el proyecto con
  Root Directory `frontend`; una sola configuración coherente con la raíz.
- **Deploy de CI fail-closed**: si falta `VERCEL_TOKEN` o `vercel pull` falla,
  el pipeline falla en lugar de omitir el despliegue con un warning.
- **PostgreSQL local** escucha solo en `127.0.0.1:5434` (antes `0.0.0.0`).
- **`DATABASE_SCHEMA` documentado** en los `.env.example` (Prisma 7 lo exige).
- **ADR-010 actualizado** al estado real: cookies `SameSite=None`, `Origin` +
  `X-Requested-With`; familias de refresh y Argon2id quedan planificadas.
- **`engines.node` unificado en `>=24`** (backend y frontend).
- **OpenAPI** describe la sesión cookie-only, sin “tokens” en el cuerpo.
- **README** deja de afirmar que la PWA está implementada.
- **CI**: un push que solo cambia `docs/` o `scripts/` no reconstruye ni
  despliega.

### Pendiente

- **Base de producción no responde (2026-11-02 19:40 UTC):** `POST /auth/login`
  y `GET /plots/nearby` devuelven 500, y el dominio
  `fwmaehhzfydbhilpfbrl.supabase.co` no resuelve (`ENOTFOUND`). El pooler sí
  acepta TCP, así que hay que revisar en Supabase si el proyecto está
  pausado/eliminado y si el schema `agroconnect` y las migraciones siguen
  aplicados. `/health/ready` ya reporta 503 cuando la DB falla.
- Familias/generaciones de refresh tokens con revocación en cascada.
- Argon2id con rehash transparente desde bcrypt.
- Sincronización de Obsidian y Notion con los conteos y el stack de esta
  versión.
- **Siguiente ciclo:** ver ADR-016 para las opciones y criterios de PWA,
  retiro del legacy, familias de refresh, Argon2id, verificación de correo,
  `iss`/`aud`, matrices y release.

### Corregido

- **`security-audit.mjs`**: el gate marcaba cualquier advisory como “alta” y
  fallaba con vulnerabilidades moderate/low. Ahora solo bloquea
  `high`/`critical` y reporta el resto en los totales.
- **`logout`** ahora tiene rate limiting, igual que el resto de endpoints de
  autenticación.
- **`SmtpEmailService`** escapa el nombre del destinatario y las URLs en el
  HTML de los correos.
- **`searchProperties`** sanitiza el filtro PostgREST (`%`, comas, paréntesis,
  comillas) y limita la longitud de la búsqueda.
- **Frontend:** las trazas de debug de `PropertyMap`, `MarketplacePrototype` y
  `PropertyDetailModal` usan `devLog` y desaparecen en producción.
- **Matriz CU↔HU:** M17 corregido (HU70–HU76 inexistentes reemplazadas por
  HU61–HU67 con CU#66); las 6 HU sin CU quedan documentadas en
  `docs/matriz_trazabilidad_hallazgos.md`.
- **UI (Impeccable):** 6 anti-patrones corregidos (Arial, `transition: width`,
  `border-l-4`, `gray-on-color`, `animate-bounce`), regla global de
  `prefers-reduced-motion` y badge "Top" con contraste AA. La excepción de
  Inter y la deuda del accent yellow quedan en ADR-016 (D9).

## [1.0.1] — 2026-10-06

### Corregido

- **Backend:** migración a zod 4 (`required_error` → `error`) y actualización de
  `pino-http` a la versión 11 para alinear tipos con pino 10 (consecuencia de los
  bumps de Dependabot). Suite completa: **178/178 pruebas** en verde.
- **Frontend:** compatibilidad con eslint 10 (`eslint-plugin-react-hooks@7.1.1`),
  refactor de los patrones marcados por `react-hooks/set-state-in-effect` y
  reformateo con prettier 3.9.
- **Seguridad:** `source-map-js` actualizado (GHSA-68fv-2mgg-jv7q) — **0
  vulnerabilidades** en el frontend; umbral SAST `--audit-level=high` documentado
  (moderates de la toolchain de pruebas sin fix no-breaking, alerta gestionada).

### Añadido

- **CodeQL** (`security-and-quality`) en el pipeline de CI.
- **Rulesets** de protección en `main` y `develop` (PR + checks del CI; sin
  force-push ni borrado).
- **Secret scanning y push protection** activos.
- `CODE_OF_CONDUCT.md` (Contributor Covenant 2.1).

## [1.0.0] — 2026-10-05

Primera versión estable: MVP desplegado de punta a punta (M02 · M16 · M03) con
operación real verificada en producción.

### Añadido

- **M02 — Gestión de Usuarios y Perfiles:** registro e inicio de sesión reales
  (JWT con rotación de refresh tokens, bcrypt, roles productor/comprador/
  transportista/administrador) y panel de usuario.
- **M16 — Base geoespacial:** gestión de parcelas con PostgreSQL 16 + PostGIS
  3.4 y mapa interactivo con Leaflet + OpenStreetMap (nunca Google Maps).
- **M03 — Prototipo del mercado:** 12 fincas con galería por cultivo, créditos
  de imagen visibles, búsqueda, zonas productivas y modo demo sin registro.
- **PWA instalable** (service worker + Workbox) con estrategias de caché para
  conectividad rural intermitente.
- **Backend de producción** (Render + Supabase, esquema `agroconnect`) con
  registro/login verificados desde la aplicación pública.
- **Pipeline CI** (GitHub Actions): lint, type-check, pruebas backend con
  cobertura, build frontend, E2E (Playwright) y auditoría de dependencias.
- **Verificación de alineación de entornos** (`tools/alignment-check`):
  manifiesto de hechos canónicos + auditoría de local · GitHub · Notion ·
  Obsidian, con job propio en el CI.
- **Gobernanza del repositorio:** licencia, guía de contribución, política de
  seguridad, plantillas de PR/issue, Dependabot y CODEOWNERS.

### Corregido

- Estrategia de imágenes de cultivos: curación de URLs, respaldo por cultivo,
  créditos y precarga (ADR-0001).
- Prisma 7 con driver adapter (`@prisma/adapter-pg`) y esquema configurable por
  entorno (`DATABASE_SCHEMA`).
- Build de Render con devDependencies y versión de Node fijada.

### Seguridad

- Cero secretos en el repositorio: `.env` ignorados, `.env.example` versionados
  y credenciales gestionadas por entorno.
- Helmet, rate limiting en autenticación, validación de entrada con Zod y
  mensajes de error seguros para el cliente.

### Documentación

- README integral: identidad, arquitectura, 17 módulos, puesta en marcha,
  pruebas y despliegue.
- Guía de contribución y flujo Git (RUP + Scrum, PRs con aprobación y CI verde).

### Notas de versiones previas

- **0.3.0 (2026-10-04)** — Correcciones integrales de documentación (PT-FIX-01/02),
  auditorías documentales (PT-AUD-01/02) y evidencias SENA.
- **0.2.0 (2026-09)** — Incrementos 1, 2a y 2b: autenticación, perfiles,
  parcelas y prototipo del mercado con datos semilla.
- **0.1.0 (2026-08)** — Línea base documental: 68 RF · 30 RNF · 66 CU · 69 HU,
  arquitectura de referencia (PT-AR-ARQ-01) y plan de proyecto.
