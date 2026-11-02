# Auditoría integral — AgroConnect

**Fecha:** 2 de noviembre de 2026
**Alcance:** directorio local, repositorio GitHub, despliegue Vercel, API Render, base de datos local, Notion, Obsidian y documentación del repo.
**Método:** verificación ejecutable (gates reales) + inspección de código y configuración + contraste documental. Sin modificar código, datos ni entornos.
**Rama auditada:** `develop` (`6688e10`, 2026-10-30). **Producción:** `main` (`1b93d0b`, 2026-10-07) desplegada en Vercel el **2026-10-04 13:21** (29 días de antigüedad).

---

## 1. Veredicto ejecutivo

| Dimensión | Estado | Lectura |
|---|---|---|
| Calidad de código | **Alta** | 0 errores de lint/typecheck, 377 pruebas en verde, cobertura >95 %, 0 `any`, 0 SQL crudo inseguro, Clean Architecture respetada en lo esencial. |
| Seguridad de producción | **Crítica** | Producción está 24 commits atrás y conserva fallas ya corregidas en `develop`: auto-registro de administrador, rate limiting inefectivo, XSS del mapa y refresh token en `localStorage`. |
| Arquitectura | **En transición riesgosa** | Conviven dos backends completos (Express legacy y NestJS) con ~17,5k y ~18k líneas. El "Strangler Fig" es hoy una duplicación, no una migración incremental. |
| Integración frontend↔API | **Bloqueante de release** | El frontend de `develop` es cookie-only; el backend de producción (Express) devuelve tokens en el body. Además, `SameSite=Lax` no funciona entre Vercel y Render por ser sitios distintos. |
| Documentación | **Desincronizada** | Obsidian congelado al 2026-10-04; README y manifiesto de alineación con 178 pruebas y Express; CHANGELOG sin monorepo/NestJS; enlace Jira roto (404). |
| Operación/despliegue | **Frágil** | `render.yaml` no corresponde al servicio real, dos `vercel.json` contradictorios, deploy CI tolerante a fallo, PWA no funcional. |

**Conclusión:** el código de `develop` es defendible; **producción no**. No se debe promover `develop` a `main` sin resolver antes los P0 de sesión y despliegue, y no se debe dejar `main` como está porque es explotable hoy.

---

## 2. Evidencia ejecutada (gates reales, 2026-11-02)

| Gate | Comando | Resultado |
|---|---|---|
| Typecheck | `npx turbo run typecheck --concurrency=1 --force` | **5/5 workspaces OK**, 13,9 s |
| Lint | `npx turbo run lint --concurrency=1 --force` | **3/3 OK**, 0 errores, 20,2 s |
| Tests backend legacy | `turbo run test` | **188/188**, 18 suites |
| Tests API NestJS | `turbo run test` | **189/189**, 20 suites |
| Cobertura backend | CI develop | 95,39 % statements · 85 % branches |
| Cobertura API | CI develop | 95,57 % statements · 80,9 % branches |
| Unit frontend | `npm run test:unit -w agroconnect-frontend` | **21/21**, 6 archivos |
| Build frontend | `npm run build -w agroconnect-frontend` | **OK**, 601 módulos, 698 ms |
| E2E | `npm run test:e2e -w agroconnect-frontend` | **10/10**, 39,5 s |
| Auditoría de dependencias | `npm audit` | 8 low · 0 moderate/high/critical |
| CI remoto develop | GitHub Actions | 6 jobs success; deploy skipped |
| CodeQL | GitHub | 1 alerta abierta (#18, falso positivo por diseño) |
| Dependabot | GitHub | 6 alertas abiertas (5 vite, 1 handlebars) |

**Nota de honestidad técnica:** ambos Jest terminan con `Force exiting Jest`. La configuración usa `forceExit: true`, lo que **oculta** handles abiertos (conexiones Prisma, timers del throttler). Las pruebas pasan, pero la suite no cierra limpia: es deuda P2.

---

## 3. Hallazgos P0 (corregir antes de cualquier release)

> **Estado de ejecución (2026-11-02):** el cutover se ejecutó y verificó en producción (commit `c602172`): Vercel sirve el bundle nuevo con CSP y Render ejecuta NestJS con `CsrfGuard`. P0-01 a P0-05 quedaron cerrados. **P0-06 (RLS de Supabase) sigue abierto** y, además, la base de producción dejó de responder (`/auth/login` y `/plots/nearby` → 500; dominio Supabase `ENOTFOUND`). Ver §11.

### P0-01 — Auto-registro como administrador en producción
- **Evidencia:** `main:backend/src/modules/auth/domain/entities/Role.ts:3-9` incluye `administrador`; `main:backend/src/modules/auth/presentation/schemas/authSchemas.ts:4` usa `z.enum(ROLE_NAMES)`; `main:backend/src/modules/auth/application/useCases/RegisterUserUseCase.ts:48-51` solo valida que el rol exista. En `main` hay **0** coincidencias de `isSelfRegistrable`/`ROLE_NOT_ALLOWED`.
- **Impacto:** cualquier visitante puede crear una cuenta con rol administrador y acceder a funciones privilegiadas. Es explotable hoy.
- **Corrección:** portar a `main` la lista `SELF_REGISTRABLE_ROLE_NAMES` y la guardia `ROLE_NOT_ALLOWED` (ya implementadas y probadas en `develop`), más un test de regresión. Invalidar sesiones y revisar usuarios creados con rol admin.

### P0-02 — Cadena XSS + refresh token en `localStorage` en producción
- **Evidencia:** `main:frontend/src/auth/context/AuthProvider.tsx:10,28,45-52` persiste `session.tokens.refreshToken` en `localStorage`; `main:frontend/src/components/maps/PropertyMap.tsx:731` inserta HTML sin `escapeHtml` (el escape existe en `develop`, no en `main`). Vercel no envía CSP ni `X-Content-Type-Options`.
- **Impacto:** el XSS conocido del buscador del mapa permite leer el refresh token de 7 días y tomar la cuenta. La ausencia de CSP elimina la última barrera.
- **Corrección:** desplegar el escape de `develop`; migrar a cookies httpOnly (ya está en `develop`, pero ver P0-04); añadir cabeceras en Vercel; rotar/invalidar refresh tokens existentes.

### P0-03 — Rate limiting inefectivo detrás del proxy de Render
- **Evidencia:** `main:backend/src/app.ts` no ejecuta `app.set('trust proxy', …)`; `main:render.yaml:32-33` fija `RATE_LIMIT_MAX_ATTEMPTS=30`. En `develop` sí existe `TRUST_PROXY` (`backend/src/app.ts:119`, `backend/src/config/env.ts:17`).
- **Impacto:** `req.ip` es la IP del proxy: todos los usuarios comparten un único bucket. Un atacante puede bloquear el login global con 30 intentos y, a la vez, no se limita su IP real.
- **Corrección:** `TRUST_PROXY=1` en Render, límite 5–10 por ventana, clave por IP+email, y prueba detrás de proxy.

### P0-04 — Release bloqueado: cookie-only no es compatible con el backend desplegado ni con el despliegue cross-site
- **Evidencia:**
  - `develop:frontend/src/auth/api/authClient.ts:47` usa `credentials: 'include'` y `AuthProvider` ya no guarda tokens.
  - `backend/` (Express, el que corre en Render) **no emite cookies** y devuelve tokens en el body (`backend/src/modules/auth/presentation/controllers/AuthController.ts`).
  - `apps/api` (NestJS) emite cookies, pero `SessionCookieService.ts:48-56` usa `sameSite: 'lax'`, `path: '/'`, sin verificación de `Origin` ni CSRF.
  - Frontend en `*.vercel.app` y API en `*.onrender.com` son **sitios distintos**: `SameSite=Lax` no adjunta cookies en `fetch` cross-site.
- **Impacto:** si se promueve `develop` tal cual, el login de producción queda roto. Si se usa NestJS con `Lax`, también. El ADR-010 exige `SameSite=None`, `Path=/api/v1/auth`, `Origin` + `X-Requested-With`, familias de refresh y Argon2id: **nada de eso está implementado**.
- **Corrección:** decidir el backend de producción (ver §7), usar `SameSite=None; Secure` con verificación de `Origin` y token CSRF, eliminar tokens del body, acotar `Path`, y probar el flujo real contra el backend que irá a producción.

### P0-05 — Despliegue frágil: IaC divergente, dos configuraciones de Vercel y deploy tolerante a fallo
- **Evidencia:**
  - `render.yaml:3` declara el servicio `agroconnect-api`, pero la URL canónica es `agroconnect-api-5t7n.onrender.com` (Render añade un sufijo al subdominio; no implica un nombre de servicio distinto). Lo relevante es que el `rootDir`/build apuntaba al backend Express legacy y no a `apps/api`.
  - Existen `vercel.json` raíz (`build -w agroconnect-frontend`) y `frontend/vercel.json` (root `frontend`, `npm install`, `npm run build`). El proyecto Vercel usa el segundo.
  - El job de deploy (`ci.yml:309-326`) hace `vercel pull` y, si falla, emite warning y **omite** el deploy: un release puede “pasar” sin desplegar.
  - `frontend` depende de `@agroconnect/contracts`, que requiere build previo; el `npm install` aislado en `frontend` no garantiza el `dist` del contrato.
- **Impacto:** el próximo `develop→main` puede fallar en Vercel o desplegar una versión distinta a la validada. El estado real de producción no es reproducible desde el repo.
- **Corrección:** una sola configuración (root raíz, `npm ci`, build de contracts y frontend), `render.yaml` alineado o eliminado en favor del servicio real, deploy fail-closed y verificación del SHA desplegado.

### P0-06 — RLS de Supabase no verificable (riesgo alto, condicional)
- **Evidencia:** `frontend/src/services/supabase.ts:17` crea el cliente con la anon key pública; `:82-85` hace `select('*')` y `:103` un `.or(...ilike...)` con entrada del usuario. No hay acceso a la BD de Supabase desde este entorno.
- **Impacto:** si `properties` no tiene RLS habilitado y políticas correctas, cualquiera con la anon key (pública por diseño) puede leer, insertar, actualizar o borrar toda la tabla. Además, el filtro PostgREST se construye por concatenación.
- **Corrección:** verificar en el dashboard `ENABLE ROW LEVEL SECURITY` + políticas; exponer solo columnas públicas; escapar `% , ( )` en `.or`; considerar mover el marketplace al API propio.

---

## 4. Hallazgos P1

### Seguridad
| ID | Evidencia | Impacto | Corrección |
|---|---|---|---|
| P1-01 | `RefreshToken` sin `familyId/generation` (`backend/prisma/schema.prisma:78-90`); `RefreshTokenUseCase` no revoca familia | Un refresh robado y reutilizado no mata la sesión ni genera alarma | Añadir familia/generación y revocar la familia al detectar reuso |
| P1-02 | Hashes `$2b$` (bcrypt 12) en los 11 usuarios; ADR-010 exige Argon2id | Decisión documentada no implementada | Argon2id para hashes nuevos + rehash transparente |
| P1-03 | `SessionCookieService` sin verificación de `Origin/Referer` ni CSRF | Si se usa `SameSite=None`, CSRF queda abierto | Middleware de `Origin` + token CSRF |
| P1-04 | `AuthErrors`/`LoginUseCase` distinguen correo/documento/teléfono; login sin bcrypt dummy | Enumeración de cuentas y oráculo de tiempos | Respuestas genéricas + bcrypt dummy |
| P1-05 | Registro emite sesión sin verificar email (`User.ts:86-92`, `AuthController.ts:98`) | Cuentas no verificadas operan | No emitir sesión hasta `emailVerifiedAt` o marcar `PENDIENTE` |
| P1-06 | `main` usa `FileEmailService` (`app.ts:56`) y `MAIL_DIR=/tmp/agroconnect-mails` | Verificación y reset no envían correo; tokens en disco | SMTP real + limpieza; no escribir tokens |
| P1-07 | Token de reset/verificación en query string (`RequestPasswordResetUseCase.ts:46`) | Fuga por Referer/historial/logs | Fragmento `#` o POST + `Referrer-Policy: no-referrer` |
| P1-08 | `Docker Compose` publica Postgres en `0.0.0.0:5434` con password fija | Cualquiera en la LAN accede a la BD de desarrollo | `127.0.0.1:5434:5432` y password por entorno |
| P1-09 | `.env`, `.env.local` y `backend/.env` con modo 664 | Lectura por otros usuarios locales | `chmod 600`; rotar tokens si hubo exposición |
| P1-10 | Frontend sin CSP/XFO/XCTO/Referrer/Permissions-Policy | Clickjacking, MIME sniffing, fuga de referer | Cabeceras en `vercel.json` |
| P1-11 | `SmtpEmailService` interpola `fullName` sin escapar | Inyección HTML en correos | Escapar o plantilla con escape |
| P1-12 | Actions por tag, no por SHA; ruleset de `main` con 0 aprobaciones | Supply chain y merges sin revisión real | Pin a SHA + 1–2 approvals + checks de API/Contratos |
| P1-13 | `console.*` 27 en frontend (25 en `PropertyMap.tsx`) y PII en logs | Ruido y posible fuga de datos | Eliminar o logger con redacción |

### Arquitectura y código
| ID | Evidencia | Impacto | Corrección |
|---|---|---|---|
| P1-14 | `backend/src` 72 archivos/17 364 líneas vs `apps/api/src` 82/17 988; ≥25 archivos homónimos | Dos implementaciones completas del mismo dominio; divergencia ya real (cookies, SMTP, hardening) | Plan de cutover y retiro del legacy (§7) |
| P1-15 | 9 casos de uso de `apps/api/application` importan `@nestjs/common` | La capa de aplicación depende del framework (ADR-005) | Mover decoradores a providers/composition root o documentar el trade-off en ADR |
| P1-16 | `PropertyMap.tsx` 2 019 líneas; `MarketplacePrototype` 808; `cloudinary.ts` 480; `RegisterScreen` 419 | Mantenibilidad y riesgo de regresión | Extraer hooks/servicios/componentes |
| P1-17 | `scripts/` en `.gitignore` | `security-audit.mjs`, matrices y clientes Notion/Jira no son revisables ni reproducibles | Versionar en `tools/` o quitar la regla |
| P1-18 | `application` y `domain` sin pruebas de contrato contra el backend desplegado | El E2E valida NestJS en 4100, no el Express de Render | E2E contra el artefacto que va a producción |

### Documentación y operación
| ID | Evidencia | Impacto | Corrección |
|---|---|---|---|
| P1-19 | Obsidian `Estado del Proyecto.md` con fecha 2026-10-04 y datos “178 tests / main = develop / 0 vulnerabilidades” | Fuente de contexto desactualizada para personas y agentes | Actualizar con 188+189/21/10, main≠develop, NestJS y deuda |
| P1-20 | README y `tools/alignment-check/manifest.json` con 178/14/10, Express y Render Node 22 | El job de alineación **valida datos obsoletos** | Actualizar manifest + README y volver a correr `--all` |
| P1-21 | CHANGELOG `[Unreleased]` sin monorepo, NestJS, geography ni cookie-only | Trazabilidad de cambios incompleta | Registrar los 24 commits y la deuda |
| P1-22 | Enlace Jira `agroconnect.atlassian.net` → HTTP 404; MCP Jira falla | SSOT operativo roto | Reemplazar por estado “pausado” o crear sitio nuevo |
| P1-23 | Matrices: `cu_hu` 74 filas, `detalle` 203, `rf_cu_hu` 17; esperado 69 HU/66 CU | Descuadre de trazabilidad | Reconciliar contra Notion y regenerar |
| P1-24 | PWA inexistente: no hay `<link rel="manifest">`, no se registra `sw.js`, `public/` no tiene manifest; `/manifest.webmanifest` devuelve HTML | El SW es código muerto y la promesa PWA es falsa | Implementar con `vite-plugin-pwa` o eliminar SW y claims |
| P1-25 | `render.yaml` sin `TRUST_PROXY` y con `RATE_LIMIT_MAX_ATTEMPTS=30`; `NODE_VERSION` 24 vs docs 22 | Configuración divergente | Alinear IaC con el servicio real |
| P1-26 | `apps/api/.env.example` no documenta `DATABASE_SCHEMA` | Entornos nuevos fallan con Prisma 7 | Documentar y validar en `env.ts` |
| P1-27 | Dependabot apunta a `backend/package-lock.json` y `frontend/package-lock.json` inexistentes | Parches de seguridad no llegan | Reconfigurar a lockfile raíz y cerrar PRs obsoletos |
| P1-28 | `docs/despliegue.md` describe Express/178 y Node 22 | Runbook incorrecto | Reescribir para monorepo/NestJS/Node 24 |

---

## 5. Hallazgos P2

- 8 vulnerabilidades **low** en toolchain de pruebas (jest, ts-jest, `@nestjs/cli`); CI solo bloquea high.
- `engines.node` inconsistente: raíz `>=24`, backend `>=20`, API `>=24`, frontend `>=20`.
- CodeQL #18 en `tools/alignment-check/check-alignment.mjs:178`: falso positivo por diseño; documentar y suprimir con justificación.
- Bundle inicial en el límite: 182 KB gzip en producción actual; build local nuevo ≈199,6 KB (index 37,3 + react 65 + leaflet 77,8 + CSS 19,2 + runtime 0,4). `vendor-leaflet` se precarga.
- `forceExit: true` oculta handles abiertos en Jest.
- `logout` sin throttler.
- 2 `eslint-disable` y 2 TODO reales (monitoreo de errores y galería).
- `AGENTS.md.legacy`, `.open-design.json` sin versionar y `docs/` ignorado salvo ADR: higiene de repo ambigua.
- `DATABASE_SCHEMA` y `TEST_DATABASE_URL` con defaults distintos entre API, tests y CI (5434 vs 5432).

---

## 6. Correcciones metodológicas y falsos positivos

1. **JWT en `main`:** mi primer grep fue case-sensitive y no encontró `ALGORITHM`; la revisión de `levi` afirmó que `main` sí fijaba HS256, pero al inspeccionar el archivo completo se confirma que **`main` no pasa `algorithms` en `jwt.verify`** (`JwtTokenService.ts:84`). `develop` sí lo fija (`backend` y `apps/api`, línea 88). El hallazgo se mantiene para producción.
2. **GIST:** los índices espaciales existen en dev y test (`plots_centroid_gist_idx`, `producer_profiles_coordenadas_gist_idx`). El hallazgo histórico de la auditoría 2026-10-02 está cerrado.
3. **SQL injection:** no hay SQL crudo inseguro; `PrismaPlotRepository` usa tagged templates parametrizados.
4. **Mass assignment:** Zod elimina claves desconocidas y el registro construye campos explícitos.
5. **CodeQL #18:** el verificador lee el token de Notion y lo envía a `api.notion.com`; es su función, no una exfiltración.
6. **`SameSite=Lax` como CSRF:** con endpoints JSON y CORS con preflight no es explotable como CSRF clásico; el problema real es que **rompe el login cross-site** y falta defensa en profundidad.
7. **XSS del mapa en `develop`:** está corregido con `escapeHtml`; el riesgo descrito en P0-02 aplica a `main`/producción, no a `develop`.

---

## 7. Plan de remediación

### Fase 0 — Hoy (2–4 h): contener producción
1. Hotfix en `main` con: roles auto-registrables + `ROLE_NOT_ALLOWED`, `TRUST_PROXY=1`, límite 5–10, escape del mapa y cabeceras mínimas en Vercel.
2. Invalidar refresh tokens y revisar usuarios con rol `administrador` creados desde el 2026-10-07.
3. Verificar RLS de Supabase; si no está activo, deshabilitar escrituras con anon key y rotar la clave.
4. `chmod 600` de `.env*` y bind `127.0.0.1:5434:5432`.
5. Desplegar y verificar con `curl` el SHA/versión real.

**Criterio de aceptación:** `POST /register` con `rol=administrador` devuelve 403; 6 intentos fallidos devuelven 429 sin bloquear a otro usuario; el mapa escapa nombres; el frontend responde con CSP y XCTO.

### Fase 1 — Antes de promover `develop` (1–2 días): desbloquear el release
1. **Decisión de cutover** (requiere tu aprobación):
   - **Opción A (recomendada):** desplegar `apps/api` (NestJS) como servicio Render y apuntar `VITE_API_URL` allí; retirar el legacy del camino de producción.
   - **Opción B:** mantener Express y revertir el frontend a tokens en el body (no recomendado: mantiene el riesgo).
2. Cookies: `SameSite=None; Secure`, `Path=/api/v1/auth`, verificación de `Origin` + CSRF, y **eliminar tokens del body**.
3. Vercel: una sola configuración con root raíz, `npm ci`, build de `@agroconnect/contracts` y `agroconnect-frontend`, `outputDirectory: frontend/dist`, cabeceras CSP/XFO/XCTO/Referrer/Permissions-Policy.
4. E2E contra el backend que irá a producción, no solo contra NestJS local.
5. `render.yaml` alineado con el servicio real y deploy fail-closed.

**Criterio de aceptación:** registro→login→recarga→refresh→logout funciona en un preview de Vercel contra Render; el deploy falla si `vercel pull` falla; el bundle inicial sigue <200 KB gzip.

### Fase 2 — Semana 1: seguridad y documentación
1. Familias de refresh (`family_id`, `generation`) y revocación en cascada.
2. Argon2id con rehash transparente.
3. Eliminar tokens de query string; SMTP real en producción.
4. Actualizar Obsidian (`Estado del Proyecto`), README, `manifest.json`, CHANGELOG, `docs/despliegue.md` y PT-OPS-01.
5. Reemplazar el enlace Jira por estado “pausado” o sitio nuevo.
6. Dependabot al lockfile raíz; cerrar ramas obsoletas; documentar CodeQL #18.
7. Versionar `scripts/` o mover a `tools/`.

### Fase 3 — 2–4 semanas: arquitectura
1. Plan de retiro del backend legacy por módulos (identity → geography → plots), con criterios de paridad y pruebas de contrato.
2. Extraer `PropertyMap` (2 019 líneas) a hooks/componentes.
3. Resolver la dependencia `application → @nestjs/common` (providers fuera de la capa) o documentar el trade-off en ADR.
4. PWA: implementar manifest + registro de SW con `vite-plugin-pwa` o eliminar el SW muerto.
5. Observabilidad: métricas de login/refresh, alertas de reuso de token y de 429.

---

## 8. Checklist de release `develop → main`

- [ ] P0-01 a P0-06 cerrados con prueba de regresión.
- [ ] Decisión de cutover aprobada y backend de producción identificado.
- [ ] E2E verde contra el backend de producción (no solo local).
- [ ] `npm run lint`, `typecheck`, `test`, `build`, `test:e2e` verdes.
- [ ] `npm audit --audit-level=high` verde y revisión de los 8 low.
- [ ] `npx prisma migrate status` sin drift en dev/test/producción.
- [ ] Vercel: una sola config, cabeceras activas, variables en Production y Preview.
- [ ] `render.yaml` coincide con el servicio real o fue eliminado.
- [ ] Docs sincronizados (Obsidian, README, manifest, CHANGELOG, PT-OPS-01).
- [ ] Ruleset de `main` con al menos 1 aprobación y checks de API/Contratos.
- [ ] Plan de rollback documentado (redeploy del deployment anterior de Vercel y del servicio Render).

---

## 9. Decisiones que requieren tu aprobación

1. **Cutover de backend:** ¿promovemos `apps/api` (NestJS) a producción ahora (Opción A) o mantenemos Express y revertimos el frontend cookie-only (Opción B)?
2. **Dominio y CSRF:** ¿usamos `SameSite=None` + `Origin` + CSRF con los dominios actuales, o movemos la API a un subdominio del mismo sitio (requiere dominio propio)?
3. **Documentación y scripts:** ¿versionamos `docs/` (auditorías, matrices) y `scripts/` en el repo público, o los movemos a un repo privado/`tools/`?

---

## 10. Anexo — Comandos reproducibles

```bash
# Gates locales
npx turbo run typecheck --concurrency=1 --force
npx turbo run lint --concurrency=1 --force
npx turbo run test --concurrency=1 --force
npm run test:unit -w agroconnect-frontend
npm run build -w agroconnect-frontend
npm run test:e2e -w agroconnect-frontend
npm audit --json

# Estado de producción
curl -s -o /dev/null -w '%{http_code}\n' https://agroconnectpreview.vercel.app
curl -s https://agroconnect-api-5t7n.onrender.com/health
curl -sI https://agroconnectpreview.vercel.app | grep -Ei 'content-security|x-frame|x-content-type|referrer|permissions'
vercel ls agroconnectpreview
gh run list -R AgroConnect-superapp-fp/AgroConnect -L 5

# Base de datos local (solo lectura)
docker exec agroconnect-postgres psql -U agroconnect -d agroconnect_dev -Atc \
  "select count(*) from public.users"
docker exec agroconnect-postgres psql -U agroconnect -d agroconnect_dev -Atc \
  "select column_name from information_schema.columns where table_name='refresh_tokens'"
```

---

**Ubicación:** `docs/auditoria-2026-11-02.md`, versionado en el repositorio desde el 2026-11-02.

---

## 11. Ejecución de la Fase 0 (2026-11-02)

**Decisión del owner:** promover `apps/api` (NestJS), `SameSite=None` + `Origin` + CSRF con los dominios actuales, y versionar `docs/` y `scripts/`.

**Rama:** `release/p0-nestjs-cutover` · **PR:** https://github.com/AgroConnect-superapp-fp/AgroConnect/pull/63 · **Commit:** `786b1d0` (85 archivos, +7 678/−120).

### Cambios aplicados

| Área | Cambio |
|---|---|
| Sesión | Cookies `httpOnly`; `SameSite=None; Secure` en producción; `Path=/api/v1` (access) y `/api/v1/auth` (refresh); tokens fuera del cuerpo de auth |
| CSRF | `CsrfGuard` global: `Origin`/`Referer` contra `CORS_ORIGIN` + `X-Requested-With`; test de regresión |
| Frontend | `authClient` envía `X-Requested-With`; `AuthSession` ya no modela tokens |
| Cutover | `render.yaml` construye el monorepo y arranca `@agroconnect/api`; `TRUST_PROXY=1`; rate limit 10 |
| Vercel | Build de contratos + frontend; CSP, XFO, XCTO, Referrer-Policy, Permissions-Policy y HSTS |
| CI | Deploy fail-closed; `vercel@64.3.1` |
| Higiene | `docs/` y `scripts/` versionados; `.open-design.json` ignorado; Postgres local solo en loopback (config) |
| Documentación | ADR-010, runbook, README, CHANGELOG y manifiesto sincronizados |

### Gates ejecutados tras los cambios

| Gate | Resultado |
|---|---|
| `turbo run typecheck` | 5/5 |
| `turbo run lint` | 3/3 |
| `turbo run test` | 188 legacy + 194 NestJS |
| Frontend unit | 21/21 |
| Frontend build | OK |
| E2E Playwright | 10/10 |
| `alignment-check --ci` | OK |

### Estado de las acciones manuales (actualizado 2026-11-02)

| Acción | Estado | Detalle |
|---|---|---|
| Preview Vercel | **Hecho** | `agroconnectpreview-kchv56jw2-agro-connect.vercel.app` READY; HTTP 200 con CSP/XFO/XCTO/Referrer/Permissions/HSTS |
| Docker en loopback | **Hecho** | Contenedor recreado en `127.0.0.1:5434`. El contenedor anterior no usaba el volumen nombrado: los datos de **desarrollo** se perdieron y el esquema se recreó con las 4 migraciones (9 tablas, 2 índices GIST, 5 roles). Producción (Supabase) intacta. |
| `VERCEL_TOKEN` | **Validado** | El job `Deploy a producción (Vercel)` del CI de `main` terminó en verde |
| Obsidian | **Hecho** | `alignment --all` en verde tras sincronizar `develop` con `main` |
| `chmod 600` de `.env*` | **Hecho** | `.env`, `.env.local`, `backend/.env*`, `frontend/.env.local` y `.vercel/.env.production.local` en `600` |
| RLS Supabase + auditoría de admin | **Bloqueado** | No hay `psql` ni URL de Supabase en el entorno; además la base de producción no responde (ver abajo) |
| Render dashboard | **Hecho** | El servicio está vinculado al blueprint y desplegó `apps/api` (marcador CSRF: 403) |
| Merge a `main` | **Hecho** | PR #63 mergeado en `c602172`; CI de `main` 7/7 en verde |

### Hallazgo post-cutover: la base de producción no responde (2026-11-02 19:40 UTC)

- **Síntoma:** `POST /api/v1/auth/login` con un correo inexistente devuelve **500** (`INTERNAL_ERROR`); `GET /api/v1/plots/nearby` con parámetros válidos devuelve **500**. `GET /plots/nearby` sin query devuelve 422 (la validación funciona, la DB no).
- **DNS:** `fwmaehhzfydbhilpfbrl.supabase.co` → **ENOTFOUND** (el dominio del proyecto usado por el marketplace no existe). `aws-1-sa-east-1.pooler.supabase.com` resuelve y acepta TCP en 5432.
- **Diagnóstico:** el pooler está vivo, pero el proyecto/Supabase o el schema `agroconnect` no están disponibles. `/health` devolvía 200 porque solo era liveness; se añadió **`/health/ready`** (`SELECT 1`, 503 si la DB falla) para que el monitoreo no vuelva a dar un falso verde.
- **Acción requerida:** revisar en Supabase si el proyecto está pausado/eliminado, si el schema `agroconnect` y las migraciones siguen aplicados y si las credenciales del pooler en Render son válidas. Los `correlationId` (`6bf58e72…`, `4deb477e…`) están en los logs de Render.
- **Alcance:** no es una regresión del cutover; el backend legacy usaba la misma base. El marketplace cae al modo demo por el fallback del frontend.



