# ACTA DE CIERRE DE SPRINT

## AgroConnect — Plataforma agropecuaria B2B/B2C

### Documento de conciliación entre el estado reportado al 28/10/2026 y la verificación técnica al 17/11/2026

**Versión:** 1.2 — verificada; pendientes A, B y E cerrados y fase 3 planificada  
**Estado:** Aprobada técnicamente; pendiente de firma institucional  
**Documento fuente:** `AgroConnect_Estado_Avance_Sprint_2026-10-28.pdf`

| Campo | Valor |
| --- | --- |
| Proyecto | AgroConnect |
| Programa | Comercio y Turismo · Quindío |
| Centro de formación | ADSO — Ficha 3292136 |
| Ciudad | Armenia, Quindío |
| Fecha de corte documental | 28 de octubre de 2026 |
| Fecha de generación del acta | 16 de noviembre de 2026 |
| Fecha de actualización | 17 de noviembre de 2026 |
| Rama y commit del PDF | `develop @ 588b234` |
| Rama verificada | `feature/property-map-phase-2` |
| Commit base de la verificación | `ff72e9d` |
| Estado del árbol verificado | Limpio al 16/11; los cambios del cierre se incorporan en `9d884c2` (parcelas) y `eac538e` (calidad backend) |
| PRs abiertos reportados en el PDF | 0 |

---

## 1. Objetivo y alcance

### 1.1 Objetivo

Dejar constancia formal del cierre del sprint documentado en el PDF `AgroConnect_Estado_Avance_Sprint_2026-10-28.pdf`, conciliando tres visiones: el plan de trabajo autorizado, el estado reportado al 28/10/2026 y el estado real del repositorio verificado al 17/11/2026. El acta identifica entregables, evidencias reproducibles, decisiones arquitectónicas, pendientes, bloqueos y discrepancias, con el fin de que el responsable de las actas oficiales pueda incorporar la información sin ambigüedad.

### 1.2 Alcance

El documento cubre:

- Fases 0 a 7 del plan de trabajo, con su estado reportado y su estado real verificado.
- Los siete hallazgos P0 de la fase 2.1 y las correcciones aplicadas.
- Evidencias técnicas: pruebas automatizadas, cobertura, gates de calidad, commits, PRs, ADRs, migraciones y comportamiento de API.
- Pendientes A–F con criterios de aceptación verificables.
- Discrepancias entre el PDF y el repositorio, con explicación y acción sugerida.
- Bloqueos externos y responsables de su resolución.

### 1.3 Exclusiones

No forman parte de esta acta:

- Cambios de código, despliegues, migraciones en producción o mutaciones en Jira/Notion.
- El backlog post-MVP de la fase 7, que se mantiene fuera del alcance del sprint.
- La validación de firmas, credenciales o accesos externos que dependen de terceros.
- La reescritura del PDF original: las diferencias se documentan, no se corrigen sobre el documento fuente.

### 1.4 Método y fuentes

La verificación se realizó sobre el repositorio local, en la rama `feature/property-map-phase-2`, con HEAD base `ff72e9d` y los cambios del cierre en el árbol de trabajo. Se contrastaron el PDF, el manifiesto `tools/alignment-check/manifest.json`, los ADRs de `docs/adr/`, las matrices de trazabilidad, el historial de Git, las suites de pruebas y los gates de lint, typecheck, build, arquitectura, contratos y alineación. Las cifras del PDF se conservan como estado histórico del 28/10/2026; las cifras del acta corresponden a la verificación del 17/11/2026.

---

## 2. Resumen ejecutivo

El PDF reporta al 28/10/2026 que las fases 0, 1 y 2 estaban cerradas y verificadas: hotfix de seguridad P0, ocho ADRs, monorepo con contratos compartidos, scaffold NestJS 11 y módulo de identidad con cookie `httpOnly` y correo SMTP real. La verificación posterior confirma esos entregables y evidencia avances adicionales: marketplace con moderación previa, perfiles de usuario, cargas firmadas a Cloudinary, release `v1.1.2` y una suite de pruebas más amplia.

Sin embargo, la lectura granular del propio PDF muestra que la fase 0 seguía `PARCIAL` por Jira y Notion, y que la fase 2 no estaba completamente cerrada: 2.4 era `PARCIAL`, 2.5 solo tenía backend, 2.7 estaba `PENDIENTE` y 2.8 era `PARCIAL`. El repositorio actual reduce parte de esa brecha —`GET/PATCH /api/v1/profile/me` ya están implementados—, pero el port geoespacial, la migración del frontend a cookie-only, la base de frontend, Jira, Notion y la sincronización siguen pendientes o bloqueados.

### 2.1 Indicadores clave

| Indicador | PDF — 28/10/2026 | Verificación — 17/11/2026 | Lectura |
| --- | --- | --- | --- |
| Pruebas automatizadas | 373 | 488 (421 API + 53 web + 14 E2E) | Diferencia de conteo; ver §8-D1 |
| E2E Playwright | 10/10 | 14/14 | La suite se amplió después del corte; ver §8-D2 |
| Tareas Turbo | 13/13 en verde | Gates en verde: `lint`, `typecheck`, `build`, `test`, `arch:check` y `check:drift` | No se recontó el total de tareas Turbo; no se observaron regresiones |
| Vulnerabilidades HIGH | 0 | 0 (`npm audit`: 0 vulnerabilidades en raíz y API) | Confirmado y mejorado |
| Cobertura (API) | No reportada | 92,30 % líneas / 80,69 % ramas / 92,36 % statements / 94,53 % funciones | Umbral del 80 % cumplido; ver §5.1 |
| Trazabilidad canónica | No reportada en el KPI | 17 módulos, 68 RF, 30 RNF, 66 CU, 69 HU, 6 actores | Fuente: manifiesto de alineación |

### 2.2 Logros consolidados

- Corrección y verificación de los siete hallazgos P0 de seguridad de la fase 2.1.
- Monorepo contract-first con npm workspaces, Turborepo, lockfile único y `packages/contracts`.
- Backend NestJS 11 con Prisma 7, PostgreSQL 16 + PostGIS, Helmet, Pino con `correlationId`, validación Zod, filtro global de errores, throttling y cookie de sesión `httpOnly`.
- Identidad con ocho casos de uso, SMTP real y flujo de registro, login, refresh y logout verificado.
- Marketplace con moderación previa (`pending`, `approved`, `rejected`), perfiles de productor/empresa y cargas firmadas a Cloudinary.
- Port geoespacial cerrado: CRUD de parcelas con validación de polígono en dominio, área y centroide calculados por PostGIS, búsqueda por proximidad con `ST_DWithin` y autorización por rol.
- Kit de calidad backend cerrado: gate de arquitectura con dependency-cruiser, Swagger en `/docs`, seed reproducible con guard de seguridad y pruebas de integración contra PostGIS real con Testcontainers.
- Endurecimiento HTTP: límite de cuerpo JSON de 32 kB con `413 PAYLOAD_TOO_LARGE`, CORS validado y registrado antes del parser, `x-correlation-id` validado por expresión regular y `Cache-Control: no-store` en rutas autenticadas.
- `npm audit` en 0 vulnerabilidades mediante `overrides.glob` en el `package.json` raíz.
- CI con Node 24, verificación de contratos y gates de calidad.
- Diecisiete ADRs en el repositorio, incluidas las decisiones de Cloudinary firmado, marketplace vitrina y moderación previa.
- Doce migraciones locales, incluidas las tres del port geoespacial (`20261116000000`, `20261116000001` y `20261116000002`).

### 2.3 Brechas principales

- Fases 4, 5 y 6: Jira, Notion y sincronización, bloqueadas por accesos externos.
- Despliegue de producción desactualizado en Render, con 404 en endpoints ya implementados.
- Decisiones de política pendientes para el flujo de moderación P2.
- Base de frontend: router, TanStack Query, cliente OpenAPI y componentes compartidos.
- Inconsistencia de status de validación en `marketplace` e `identity` (400 en dominio frente a 422 en el contrato Zod), ya corregida en `geography`.

---

## 3. Estado por fases

La tabla conserva el estado literal del PDF y lo contrasta con la verificación actual. Cuando el estado real difiere, se indica la evidencia y la acción asociada.

| Fase | Estado en el PDF (28/10) | Estado real verificado (16/11) | Evidencia | Observación |
| --- | --- | --- | --- | --- |
| 0 | PARCIAL | PARCIAL | Rama y PRs operativos; Jira anterior responde 404; plantillas Notion sin compartir | Cierra cuando se resuelvan los accesos externos |
| 1 | CERRADA | CERRADA | PR #52 · `ae1ffc2`; ADRs 008–015 y workflow de ingeniería | El repositorio acumula 17 ADRs: 0001, 0008–0023 |
| 2.1 | CERRADA | CERRADA | PR #51 · `5423e52`; siete hallazgos P0 corregidos | Rutas reales bajo `apps/api/src/...`; ver §8-D5 |
| 2.2 | CERRADA | CERRADA | PR #54 · `6326ecc`, `71196a8`; monorepo, contratos, build dual y CI | Sin cambios de alcance |
| 2.3 | CERRADA | CERRADA | PR #57 · `8b5e6bc`; NestJS 11, Prisma 7, identidad, SMTP, cookie y throttling | El PDF dice `backend/`; el código real está en `apps/api` |
| 2.4 | PARCIAL | PARCIAL con avance | PR #59 · `0c5a88b`; dominio y 8 CU portados. `84db165` implementa `GET/PATCH /api/v1/profile/me`, rol y UI "Mi perfil" | Siguen pendientes los endpoints de administración de usuarios |
| 2.5 | BACKEND SÍ | CERRADA | Cookie `httpOnly` implementada y probada; `5267e8b` migra el frontend a cookie-only y elimina el fallback Bearer | Cierre del pendiente B |
| 2.6 | CERRADA | CERRADA | `SmtpEmailService` con Nodemailer; `FileEmailService` solo para desarrollo/pruebas | Sin cambios |
| 2.7 | PENDIENTE | CERRADA | CRUD `/plots` con PostGIS, `/plots/nearby` con `ST_DWithin`, tres migraciones y E2E contra PostGIS real | Cierre del pendiente A |
| 2.8 | PARCIAL | CERRADA | Dependency-cruiser (123 módulos, 383 dependencias, 0 violaciones), Swagger en `/docs`, seed con guard de seguridad y Testcontainers PostGIS (6/6) | Cierre del pendiente E; `@swc/jest` adoptado en `ae38f89` (98,7 s → 23,4 s, 4,2×) |
| 3 | PENDIENTE | PLANIFICADA | Sin router, sin TanStack Query y sin `src/shared/ui`; alcance, decisiones e incrementos ya definidos | Plan en `docs/plan-fase-3-frontend.md` (pendiente F) |
| 4 | BLOQUEADA | BLOQUEADA | Jira anterior 404; se requiere cuenta nueva y API token | Depende del usuario |
| 5 | BLOQUEADA | BLOQUEADA | Plantillas SENA en Notion sin compartir con la integración; solo hay exportaciones PDF | Depende del administrador de Notion |
| 6 | PENDIENTE | PENDIENTE | La sincronización de cuatro entornos depende de 4 y 5 | No puede iniciar sin las fases 4 y 5 |
| 7 | BACKLOG | BACKLOG | Roadmap post-MVP | Fuera del alcance del sprint |

**Lectura de cierre:** las fases 1, 2.1, 2.2, 2.3, 2.5, 2.6, 2.7 y 2.8 están cerradas; 0 y 2.4 están parciales; 3 y 6 están pendientes; 4 y 5 están bloqueadas; 7 permanece en backlog. Por tanto, la afirmación del resumen ejecutivo del PDF según la cual "las fases 0, 1 y 2 están cerradas" debe interpretarse como cierre de los hitos principales de la fase 2, no como cierre total de todas sus subfases. Con los pendientes A, B y E cerrados, el resto de la fase 2 queda limitado a los endpoints de administración de usuarios (2.4) y a los accesos externos de la fase 0.

---

## 4. Hallazgos P0 de la fase 2.1

La fase 2.1 se cerró con el PR #51 (`5423e52`). Los siete hallazgos y sus correcciones son:

| # | Hallazgo | Corrección aplicada | Archivo de referencia | Estado |
| --- | --- | --- | --- | --- |
| 1 | Auto-registro de administrador | Rol bloqueado en el esquema compartido; respuesta 422 | `packages/contracts/src/authSchemas.ts` | Corregido |
| 2 | Ausencia de trust proxy | `app.set('trust proxy', env.TRUST_PROXY)` | `apps/api/src/app.ts:119` | Corregido |
| 3 | Rate limit global insuficiente | Limitadores por ruta, incluidos `/register` y `/refresh` | `authRoutes.ts` | Corregido |
| 4 | Verificación JWT sin algoritmo | `jwt.verify(..., { algorithms: [ALGORITHM] })` | `JwtTokenService.ts:88` | Corregido |
| 5 | Carrera en rotación de refresh token | Transacción con guarda `revoked: false`; conteo distinto de 1 rechaza | `PrismaUserRepository.ts:180–192` | Corregido |
| 6 | Error P2002 sin mapear | `uniqueViolationTarget` → respuesta 409 | `shared/infrastructure/prismaErrors.ts` | Corregido |
| 7 | XSS en leaflet-geosearch | `escapeHtml()` sobre datos de BD y Nominatim | `frontend/src/utils/escapeHtml.ts` | Corregido |

**Nota de rutas:** el PDF usa el prefijo `backend/...`; en el monorepo real las rutas corresponden a `apps/api/src/...`. Se conserva el nombre del archivo y la línea cuando fue verificada, y se documenta la diferencia en §8-D5.

---

## 5. Evidencias técnicas

### 5.1 Pruebas y cobertura

| Suite | Cantidad | Estado |
| --- | --- | --- |
| Backend / API | 421 (45 suites) | En verde |
| Frontend / web | 53 (15 archivos) | En verde |
| E2E Playwright | 14 | En verde |
| Total automatizado | 488 | En verde |
| Cobertura de líneas (API) | 92,30 % (1716/1859) | Verificada |
| Cobertura de ramas (API) | 80,69 % (836/1036) | Verificada, umbral 80 % |
| Cobertura de statements (API) | 92,36 % (1803/1952) | Verificada |
| Cobertura de funciones (API) | 94,53 % (415/439) | Verificada |

Gates ejecutados el 17/11/2026: `lint`, `typecheck`, `build`, `test`, `arch:check`, `generate:openapi`, `check:drift`, `prisma migrate status` (dev y test) y `npm audit`. El PDF reporta 13/13 tareas Turbo; en esta acta se deja constancia de los gates ejecutados y de la ausencia de regresiones observadas, sin recontar el total de tareas.

Evidencia de los gates del backend:

- `typecheck`, `lint`, `arch:check` y `test` con código de salida 0.
- `arch:check`: `✔ no dependency violations found (123 modules, 383 dependencies cruised)`.
- `npm audit`: 0 vulnerabilidades en raíz y en `@agroconnect/api`.
- `prisma migrate status`: 12 migraciones, `Database schema is up to date!` en `agroconnect_dev` y `agroconnect_test`.
- `check:drift`: `✓ openapi.json sincronizado con los esquemas Zod (sin drift)`.
- Testcontainers PostGIS: 6/6 pruebas ejecutadas contra `postgis/postgis:16-3.4`.

### 5.2 Commits verificados

| Commit | Ámbito | Contenido verificado |
| --- | --- | --- |
| `84db165` | Perfiles | `GET/PATCH /api/v1/profile/me`, rol, UI "Mi perfil", PostGIS |
| `d53e30c` | Cargas y marketplace | `POST /api/v1/uploads/signature` con Cloudinary firmado; `PATCH /api/v1/products/:id` con corrección BOLA; ADR-021 |
| `5267e8b` | API y contratos | Alineación de `DATABASE_SCHEMA`, refresh 401, logout seguro, OpenAPI y CI |
| `fc85b7a` | Seguridad de autenticación | Cooldown contra email bombing, ocultamiento de `producerId`/`farmerId`, validación runtime |
| `c3bba05` | Cloudinary | Smoke de subida firmada `dfuu6j1ht` |
| `8fdf12a` | Release | Versión `v1.1.2` |
| `5c80252` | Moderación | Estados `pending`, `approved`, `rejected` y endpoints de administración |
| `221d542` | Frontend | `ModerationScreen` |
| `0599d95` | Operación | `create-admin.ts` y script `npm run create:admin -w @agroconnect/api` |
| `ca2e7f7` | Trazabilidad | Decisión D7 aplicada a las matrices |
| `ff72e9d` | Moderación | Localización de cultivo y reintento (`data-testid="moderation-retry"`) |
| `9d884c2` | Parcelas | Port geoespacial con PostGIS: CRUD `/api/v1/plots`, búsqueda por proximidad, tres migraciones, autorización por rol y contrato con 17 rutas |
| `eac538e` | Calidad backend | dependency-cruiser, Swagger en `/docs`, seed con guard reproducible, Testcontainers PostGIS, límite de 32 kB con `413 PAYLOAD_TOO_LARGE` y CORS antes del parser |

Los mensajes se presentan de forma abreviada; el hash es la referencia canónica.

### 5.3 Pull requests de referencia

| PR | Commit(s) | Fase | Alcance | Estado |
| --- | --- | --- | --- | --- |
| #51 | `5423e52` | 2.1 | Siete hallazgos P0 | CERRADA |
| #52 | `ae1ffc2` | 1 | Ocho ADRs y workflow de ingeniería | CERRADA |
| #54 | `6326ecc`, `71196a8` | 2.2 | Monorepo, contratos, build dual y CI | CERRADA |
| #57 | `8b5e6bc` | 2.3 | NestJS, Prisma e identidad | CERRADA |
| #59 | `0c5a88b` | 2.4 | Dominio y ocho casos de uso | PARCIAL |

### 5.4 ADRs

El repositorio contiene 17 archivos en `docs/adr/`: `0001`, `0008` a `0015`, `0016` a `0020` y `0021` a `0023`, además del `README.md`. Las decisiones más relevantes para este cierre son:

| ADR | Decisión |
| --- | --- |
| ADR-008 | Monolito modular |
| ADR-009 | Stack backend NestJS |
| ADR-010 | Estrategia de sesión |
| ADR-011 | Política políglota |
| ADR-012 | App móvil con Expo |
| ADR-013 | Motor de rutas externo |
| ADR-014 | Servicio `agro-intelligence` en Python |
| ADR-015 | Monorepo contract-first |
| ADR-021 | Cloudinary firmado para imágenes de producto |
| ADR-022 | Marketplace vitrina |
| ADR-023 | Moderación previa de productos |

### 5.5 Base de datos

Se verificaron doce migraciones locales, aplicadas y sincronizadas en `agroconnect_dev` y `agroconnect_test`. Las tres del cierre son `20261116000000_add_plot_geometry` (columna `geom geometry(Polygon,4326)`, trigger `plots_sync_geometry_trigger` que deriva centroide y área con `ST_Centroid` y `ST_Area(geom::geography)`, índices GIST y CHECK de bounding box de Colombia), `20261116000001_add_plot_updated_at` y `20261116000002_harden_plot_geometry` (CHECK `ST_IsValid` y área positiva). La migración de moderación sigue siendo `20261105000000_add_product_moderation`. El esquema usa PostgreSQL 16 + PostGIS 3.4 y Prisma 7 con adaptador `pg`.

### 5.6 Comportamiento de API verificado

- Registro: `201`.
- Login: `200`.
- Refresh: `200`, con la sesión transportada únicamente en cookie.
- Logout: `204`.
- Cookies con `HttpOnly`, `Secure` y `SameSite=Lax`.
- Rate limit: cinco intentos con `401` y el sexto con `429`, con cabeceras `ratelimit-policy` y `retry-after`.
- Moderación: endpoints de administración para listar y cambiar estado; UI con reintento.
- Perfiles: `GET/PATCH /api/v1/profile/me` con control de rol.
- Cloudinary: firma de subida y smoke test verificado.
- Parcelas: `POST /api/v1/plots` (`201`), `GET /api/v1/plots` (paginado), `GET /api/v1/plots/:id`, `PATCH /api/v1/plots/:id`, `DELETE /api/v1/plots/:id` (`204`) y `GET /api/v1/plots/nearby` con `distanceKm` calculada por PostGIS.
- Autorización de parcelas: `403` para roles sin permiso (`comprador_b2b`, `comprador_b2c`, `transportista`) y para parcelas de otro productor.
- Validación de polígonos: `422` para anillo no cerrado, menos de tres vértices, más de 500, coordenadas fuera de Colombia o polígono degenerado; el anillo se cierra en dominio según RFC 7946 antes de persistir.
- Documentación: `/docs` y `/docs/openapi.json` en la raíz (`200`); `/api/v1/docs` responde `404`.
- Cuerpo excesivo: JSON mayor de 32 kB devuelve `413 PAYLOAD_TOO_LARGE` con cabeceras CORS presentes.

### 5.7 Trazabilidad D7

La decisión D7, aprobada el 2026-11-05, establece las siguientes equivalencias:

- HU06 → HU14.
- HU15 → HU08.
- HU04 → HU11.
- HU33 → CU#31.
- HU08, HU28 y HU30 no tienen equivalencia; no deben inventarse.

Estado al 2026-11-17: se aplicó lo que no requiere numeración nueva (relación `CU#31→HU33` en `cu_hu.csv`, traza `RF-33 → CU#31 → HU33` en `rf_cu_hu_detalle.csv` y registro de las equivalencias en la columna `Fuente Asignacion` de `detalle.csv`). La renumeración sigue bloqueada por la numeración oficial del Product Backlog v2.0 para los códigos desplazados HU08, HU11 y HU14; el detalle está en `docs/matriz_trazabilidad_hallazgos.md` y la verificación se ejecuta con `python3 scripts/build_traceability_matrix.py --check`.

---

## 6. Arquitectura y decisiones

### 6.1 Monorepo

El repositorio usa npm workspaces y Turborepo, con lockfile único y `packageManager: npm@12.2.0`. La separación principal es `apps/web`, `apps/api` y `packages/contracts`. El build dual ESM+CJS se resolvió con esbuild; la causa raíz del fallo E2E fue `does not provide an export named 'companySchema'`.

### 6.2 Contratos

`packages/contracts` define esquemas Zod que se proyectan a OpenAPI 3.1. El contrato cubre diecisiete rutas y se valida con `check:drift` en CI. Esta decisión evita que frontend y backend diverjan en tipos y validaciones.

### 6.3 Backend

El backend es un monolito modular NestJS 11 con Prisma 7 y PostgreSQL 16 + PostGIS. Incorpora Helmet, Pino con `correlationId`, validación Zod, filtro global de errores que no expone trazas en 5xx, throttling por ruta y cookie de sesión `httpOnly`. La identidad cubre ocho casos de uso y ocho rutas legacy portadas. El CI incluye PostgreSQL con PostGIS. La regla de dependencias de Clean Architecture se verifica con dependency-cruiser (`arch:check`: 123 módulos, 383 dependencias, 0 violaciones) y la documentación de API se sirve desde `/docs` con Swagger contract-first.

### 6.4 Frontend

El frontend usa React, Vite, TypeScript y Tailwind CSS 4, con Leaflet y OpenStreetMap para la visualización geoespacial. La moderación y los perfiles ya tienen interfaz. La sesión es cookie-only desde `5267e8b`: no hay tokens en `localStorage`, el cliente usa `credentials: 'include'` y el refresh es silencioso, sin fallback Bearer.

### 6.5 Política políglota

El núcleo es TypeScript; Python se reserva para el servicio satélite `agro-intelligence`; SQL/PostGIS resuelve el cálculo geoespacial; los motores externos se integran mediante adaptadores. Expo/React Native reemplaza Flutter para la app móvil. La base de datos es PostgreSQL propio, no Supabase.

### 6.6 Producto

El marketplace es una vitrina: no gestiona precio, unidad ni inventario. La moderación previa está reservada al rol `administrador`. Estas decisiones están documentadas en ADR-022 y ADR-023 y deben reflejarse en la documentación SENA y en las pruebas de aceptación.

---

## 7. Pendientes con criterios de aceptación

### 7.1 Pendientes A–F

| ID | Pendiente | Criterio de aceptación | Evidencia esperada | Responsable sugerido | Estado |
| --- | --- | --- | --- | --- | --- |
| A | Port geoespacial | `POST /plots` y `GET /plots/nearby` funcionando; centroid, CRUD de parcelas y E2E con PostGIS | Tres migraciones aplicadas, contrato con 17 rutas, pruebas unitarias e integración, E2E contra PostGIS real | Backend / Datos | Cerrado |
| B | Frontend cookie-only | Sin `localStorage['agroconnect.session']`; `credentials: 'include'`; refresh silencioso; sin fallback Bearer | `5267e8b`; verificado en inspección y E2E de login, refresh y logout | Frontend | Cerrado en `5267e8b` |
| C | Despliegue | Render con `TRUST_PROXY=1` y `CORS_ORIGIN` sin localhost; Blueprint; cabeceras en `frontend/vercel.json`; eliminar `vercel.json` raíz | Smoke de producción sin 404 en productos y perfil | DevOps / Infraestructura | Bloqueado por API key |
| D | Documentación SENA | PT-ECU-01 v2.0 con 31 CU pendientes (referencias CU#23–28 y CU#37–66) y 6 actores; PT-IGS-01 secciones 1–10 con M14/M15/M17; PT-MTC-01 v2.0 secciones 1–8, Node 24, Render 512 MB y monolito modular | PDFs finales y matrices actualizadas | Documentación / SENA | Pendiente |
| E | Calidad backend | dependency-cruiser, Swagger en `/docs`, `prisma/seed.ts` y Testcontainers PostGIS | `arch:check` 0 violaciones, `/docs` 200, seed con guard verificado, Testcontainers 6/6 | Backend / QA | Cerrado |
| F | Base frontend | React Router 7, TanStack Query + cliente OpenAPI, `src/shared/ui` con Button/Input/Card/Modal/Toast/Skeleton/EmptyState; dividir `PropertyMap.tsx` y `MarketplacePrototype.tsx` | Build, lint, pruebas y smoke de rutas | Frontend | Pendiente |

**Nota sobre la fase D:** la cifra de 31 CU pendientes se conserva del PDF. Los rangos CU#23–28 y CU#37–66 son referencias de la matriz y no deben interpretarse como una lista exhaustiva hasta cruzar el detalle de los 66 CU.

### 7.2 Residuales identificados

| Residual | Impacto | Acción |
| --- | --- | --- |
| Endpoints de administración de usuarios | Fase 2.4 incompleta | Definir alcance y contrato; implementar y probar |
| Fixture de administrador para E2E | Cobertura E2E limitada | Crear fixture reproducible y prueba de moderación |
| Paginación de `GET /products/pending` | Escalabilidad del panel de moderación | Cerrado en `6b835b3`: `limit` 1..100 (default 20), `offset` y orden `createdAt,id` |
| Prueba automatizada de `create:admin` | Operación no cubierta | Añadir prueba de integración del script |
| Límite real de Cloudinary | Riesgo de producción | Verificar plan, cuota y estrategia de fallback |
| Referencias históricas en CHANGELOG/ADR | Trazabilidad | Revisar y actualizar en el próximo corte |
| Decisiones de moderación P2 | Flujo de rechazo incompleto | Resolver motivo obligatorio/opcional, notificación, auditoría y paginación |
| BD `agroconnect_test` acumulada | Datos de corridas previas; la generación aleatoria de placa se amplió a formato `ABC12D` (26 000 combinaciones) y consulta a BD | Cerrado el 17/11: limpieza ejecutada (`test:reset-db --yes`, 10 tablas) y suite 46/428 en verde sobre base limpia (10,7 s); la base queda limpia con los 5 roles |
| `.env.example` sin variables del seed | El onboarding falla con `exit 1` si no se declaran `SEED_ADMIN_PASSWORD` y `SEED_PRODUCER_PASSWORD` | Añadirlas manualmente (el agente no puede editar archivos `.env*`) |
| Validación 400/422 en `marketplace` e `identity` | Inconsistencia con la semántica del contrato (400 = cuerpo malformado, 422 = regla de negocio) | Cerrado en `6b835b3`: marketplace alineado a 422 con guardas numéricas; `geography` ya estaba alineado |
| `@swc/jest` no adoptado | La suite de API tardaba más de lo necesario | Cerrado en `ae38f89`: `ts-jest` → `@swc/jest` (98,7 s → 23,4 s) con cobertura ≥80 % en ramas |

---

## 8. Discrepancias documentadas

| ID | Discrepancia | PDF dice | Realidad verificada | Explicación | Acción |
| --- | --- | --- | --- | --- | --- |
| D1 | Total de pruebas | 373 | 488 (421 + 53 + 14) | El PDF no discrimina por suite y la cifra no se reproduce con el conteo actual; las 421 incluyen el port geoespacial | Usar 488 como cifra verificable y anotar la diferencia |
| D2 | E2E | 10/10 | 14/14 | La suite se amplió después del corte del 28/10 | Actualizar la cifra en el próximo informe |
| D3 | Estado de la fase 0 | Resumen: fases 0–2 cerradas; tabla: fase 0 PARCIAL | Fase 0 PARCIAL | La fase 0 depende de Jira y Notion; prevalece la lectura granular | Corregir la redacción del próximo informe |
| D4 | Commit de corte | `588b234` | `ff72e9d` | El PDF se generó en un corte anterior; el repositorio avanzó con perfiles, moderación y correcciones | Mantener ambos como "corte PDF" y "verificación actual" |
| D5 | Rutas de los hallazgos | `backend/src/...` | `apps/api/src/...` | El código se movió al monorepo; la desviación ya está registrada en la fase 2.3 | Actualizar referencias en el acta; no reescribir el PDF |
| D6 | `GET/PATCH /me` | Fase 2.4: faltan | Implementados en `84db165` | El PDF es anterior a la implementación de perfiles | Reclasificar 2.4 como "PARCIAL con avance" |
| D8 | Cobertura reportada | No reportada en el PDF; acta v1.0: 94,01 % líneas / 82,32 % ramas | 92,30 % líneas / 80,69 % ramas (API, 45 suites) | La acta v1.0 no indicaba la suite medida; al incorporar las pruebas del port geoespacial la cobertura de API desciende, pero permanece por encima del umbral del 80 % | Reportar siempre cobertura por suite y con numerador/denominador |

---

## 9. Bloqueos y responsables

| Bloqueo | Impacto | Qué se necesita | Responsable | Estado |
| --- | --- | --- | --- | --- |
| Redespliegue en Render | Producción con build antiguo; 404 en `/api/v1/products` y `/api/v1/profile/me` | `RENDER_API_KEY` o deploy hook | Infraestructura / usuario | Abierto |
| Jira | Fases 4 y 6 | Cuenta nueva, API token y variables en `~/.config/secrets.env` | Usuario | Bloqueado |
| Notion | Fases 5 y 6 | Compartir la página de plantillas SENA con la integración | Usuario / administrador de Notion | Bloqueado |
| CSV D7 | Renumeración a Product Backlog v2.0 | Numeración oficial de HU08, HU11 y HU14 desplazados; la relación CU#31→HU33 ya está aplicada | Requisitos / Trazabilidad | Bloqueado |
| Moderación P2 | Flujo de rechazo | Decidir motivo obligatorio/opcional, notificación, auditoría y paginación | Producto / UX / Backend | Bloqueado |
| Fixture admin E2E | Cobertura de moderación | Crear fixture y prueba automatizada | QA / Backend | Pendiente |
| Límite de Cloudinary | Subidas en producción | Verificar cuota y fallback | Backend / Infraestructura | Pendiente |

**Declaración de verificación:** la evidencia de esta acta se ejecutó sobre el árbol de trabajo de la rama indicada. No se declara conformidad de producción ni cierre de fases bloqueadas por accesos externos. Las cifras del PDF se conservan como estado histórico y se contrastan con la evidencia reproducible del repositorio.

---

## 10. Aprobaciones

| Rol | Nombre | Firma | Fecha |
| --- | --- | --- | --- |
| Elaboró — Arquitectura / Desarrollo |  |  |  |
| Revisó — QA |  |  |  |
| Aprobó — Instructor SENA |  |  |  |
| Aprobó — Líder de proyecto |  |  |  |

---

## Anexo A. Comandos de verificación

```bash
# Estado del repositorio
git rev-parse --abbrev-ref HEAD
git log --oneline -1
git status --porcelain

# Calidad (raíz del monorepo)
npm run lint
npm run typecheck
npm run build
npm test

# Calidad del backend
npm run lint --workspace @agroconnect/api
npm run typecheck --workspace @agroconnect/api
npm test --workspace @agroconnect/api -- --coverage
npm run arch:check --workspace @agroconnect/api
npm run generate:openapi --workspace @agroconnect/api
npm run check:drift --workspace @agroconnect/api
npm audit --workspace @agroconnect/api

# E2E (arranca API y frontend automáticamente)
npm run test:e2e --workspace agroconnect-frontend

# Contratos y alineación
npm run check:drift
npm run alignment -- --ci

# Base de datos (Prisma 7 lee prisma.config.ts; ejecutar desde apps/api)
cd apps/api
npx prisma migrate status
```

Los comandos de Prisma deben ejecutarse desde `apps/api`; el resto, desde la raíz del monorepo. Los resultados citados en esta acta corresponden a la ejecución del 17/11/2026.

---

## Anexo B. Referencias

| Fuente | Ubicación | Uso |
| --- | --- | --- |
| PDF de estado de avance | `AgroConnect_Estado_Avance_Sprint_2026-10-28.pdf` | Estado histórico al 28/10/2026 |
| Manifiesto de alineación | `tools/alignment-check/manifest.json` | Cifras canónicas, URLs, Notion y trazabilidad |
| ADRs | `docs/adr/` | Decisiones arquitectónicas |
| Matrices de trazabilidad | `docs/matriz_trazabilidad_*.md` y `*.csv` | RF, RNF, CU, HU y D7 |
| Commits y PRs | Historial Git y PRs #51, #52, #54, #57 y #59 | Evidencia de implementación |
| Repositorio | `https://github.com/AgroConnect-superapp-fp/AgroConnect` | Código y releases |
| Aplicación | `https://agroconnectpreview.vercel.app` | Vista previa |
| API | `https://agroconnect-api-5t7n.onrender.com` | Servicio desplegado |
| Notion | Root `1d7bdc33f29483caadf20189d8ee9b19`; ops `3efbdc33-f294-815d-a9e6-e6231aa0ca05` | Documentación SENA |
| Obsidian | `~/Documents/Obsidian Vaults/Ningendo Bee/AgroConnect/` | Knowledge base del proyecto |

---

## Anexo C. Glosario breve

| Término | Definición |
| --- | --- |
| ADR | Architecture Decision Record; registro de una decisión arquitectónica y sus consecuencias. |
| BOLA | Broken Object Level Authorization; fallo de autorización a nivel de objeto. |
| CU | Caso de uso. |
| D7 | Decisión de trazabilidad que define equivalencias entre historias y casos de uso. |
| E2E | Prueba de extremo a extremo. |
| HU | Historia de usuario. |
| P0 | Prioridad máxima; hallazgo crítico de seguridad o funcionamiento. |
| PostGIS | Extensión geoespacial de PostgreSQL. |
| RF / RNF | Requisito funcional / requisito no funcional. |
| SMTP | Protocolo de envío de correo electrónico. |
| SSOT | Single Source of Truth; fuente única de verdad. |

---

**Fin del documento.**  
Versión 1.2 — verificada el 17/11/2026. Los pendientes A, B y E constan como cerrados con la evidencia de §5. El pendiente F queda planificado en `docs/plan-fase-3-frontend.md`. Las firmas de §10 permanecen pendientes.
