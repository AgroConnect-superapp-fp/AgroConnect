# INFORME DE CIERRE DE SPRINT

## AgroConnect — Plataforma agropecuaria B2B/B2C

### Cierre técnico del sprint documentado en `AgroConnect_Estado_Avance_Sprint_2026-10-28.pdf`

**Versión:** 2.2 — cierre técnico con P-01 implementado  
**Estado:** Cierre técnico procedente con salvedades; cierre institucional condicionado a trámites externos  
**Fecha de corte:** 26 de noviembre de 2026  
**Documento fuente:** `AgroConnect_Estado_Avance_Sprint_2026-10-28.pdf`  
**Plan fuente:** Plan de trabajo — AgroConnect: arquitectura, módulos, Jira y documentación SENA

---

## 0. Control documental

| Campo | Valor |
| --- | --- |
| Proyecto | AgroConnect |
| Programa | Comercio y Turismo · Quindío |
| Centro de formación | ADSO — Ficha 3292136 |
| Ciudad | Armenia, Quindío |
| Tipo de documento | Informe de cierre de sprint |
| Periodo de referencia | Plan del 22/10/2026; avance al 28/10/2026; cierre verificado al 26/11/2026 |
| Rama verificada | `feature/property-map-phase-2` |
| Commit de corte | `2dca6d4` |
| Estado del árbol | Código P-01 en `2dca6d4`; cierre documental en curso |
| Fuentes contrastadas | PDF de avance, plan autorizado, historial Git, ADRs, contratos OpenAPI, manifiesto de alineación, matrices de trazabilidad, suites de pruebas y gates ejecutados |
| Documento detallado de soporte | `docs/acta-cierre-sprint-2026-10-28.md` |

**Nota metodológica.** El PDF del 28/10 se conserva como estado histórico. Este informe no lo reescribe: lo contrasta con la evidencia ejecutada en el repositorio y deja explícitas las diferencias. Las cifras de pruebas y cobertura corresponden al corte del 26/11/2026.

---

## 1. Resumen ejecutivo

El sprint cierra con el núcleo técnico de AgroConnect consolidado: seguridad P0 corregida, monolito modular NestJS 11 operativo, contratos compartidos, módulo geoespacial con PostGIS, marketplace con moderación, frontend con router y capa de datos, y una suite automatizada de **635 pruebas**.

El avance respecto al informe del 28/10 es sustancial:

- Se pasó de **373 a 635 pruebas automatizadas**.
- Los E2E crecieron de **10 a 18**, con axe WCAG AA en rutas críticas y mapa móvil bajo demanda.
- El frontend cerró las cinco fases de su plan de modernización: router, TanStack Query, sistema de componentes, división del marketplace y documentación.
- El build de producción quedó cubierto por un smoke test propio, después de corregir un fallo que no detectaba el E2E contra Vite dev.
- El bundle inicial bajó a **109,4 KB gzip** y el LCP de marketplace quedó en **2,83 s**, a 0,33 s del objetivo.
- La API mantiene cobertura por encima del umbral: **91,89 % líneas / 80,42 % ramas**.

Sin embargo, **el sprint no cierra todas las fases del plan**:

- La fase 0 sigue parcial por Jira, Notion y variables de Render.
- La fase 2.4 quedó cerrada en backend con P-01; la UI de administración de usuarios queda como pendiente de producto.
- Las fases 4 y 5 están bloqueadas por accesos externos.
- La fase 6 depende de esas dos.
- Los documentos SENA no se reemplazaron en Notion.
- El despliegue de producción no pudo verificarse sin la API key de Render.

**Conclusión:** procede declarar el cierre **técnico** del sprint, con salvedades documentadas. No procede declarar el cierre del producto, de la documentación SENA ni de la operación en producción.

---

## 2. Objetivo, alcance y método

### 2.1 Objetivo

Dejar constancia formal del cierre del sprint iniciado con el plan de arquitectura, módulos, Jira y documentación SENA, verificando qué se entregó, qué se corrigió, qué se desvió y qué queda bloqueado.

### 2.2 Alcance

El informe cubre:

- Las fases 0 a 7 del plan autorizado.
- Los siete hallazgos P0 de seguridad.
- La migración arquitectónica a monolito modular NestJS.
- El port geoespacial y la calidad backend.
- La fase 3 completa de frontend.
- Las métricas de pruebas, cobertura, rendimiento, accesibilidad y seguridad.
- Los pendientes con criterios de aceptación y responsables.

### 2.3 Exclusiones

- No se declara conformidad de producción.
- No se validan firmas, credenciales ni accesos de terceros.
- No se incluye el backlog post-MVP como trabajo entregado.
- No se reescriben Jira, Notion ni el PDF original.
- No se presentan como implementados los módulos que siguen en roadmap.

### 2.4 Método de verificación

La verificación se ejecutó sobre el repositorio local, con árbol limpio, mediante:

1. Contraste del PDF y el plan contra el historial Git.
2. Inspección de código, contratos, ADRs y migraciones.
3. Ejecución de lint, typecheck, pruebas, cobertura, arquitectura, contratos, build, preview y E2E.
4. Comparación con el manifiesto `tools/alignment-check/manifest.json`.
5. Revisión de las matrices de trazabilidad y del estado de Obsidian.

---

## 3. Estado de cierre por fases

| Fase | Nombre | Estado al cierre | Evidencia y lectura |
| --- | --- | --- | --- |
| 0 | Accesos y prerrequisitos | **PARCIAL** | Rama y PRs operativos. Jira anterior responde 404; plantillas Notion sin compartir; variables de Render sin verificar. |
| 1 | Decisiones de arquitectura | **CERRADA** | ADRs 008–015, `CONTRIBUTING.md` y workflow de ingeniería. El repositorio acumula 19 ADRs. |
| 2.1 | Hotfix de seguridad P0 | **CERRADA** | Siete hallazgos corregidos y probados. |
| 2.2 | Monorepo y contratos | **CERRADA** | npm workspaces, Turborepo, `packages/contracts`, OpenAPI 3.1 y drift check. |
| 2.3 | Scaffold NestJS | **CERRADA** | API canónica en `apps/api`; cutover a NestJS con sesión cookie-only y CSRF de origen. |
| 2.4 | Portar identidad | **CERRADA** | Ocho casos de uso, `GET/PATCH /profile/me`, perfiles operativos y administración de usuarios: listado/búsqueda, detalle, cambio de estado y rol (RF-07/08/09), con protección del último administrador y revocación de sesiones. |
| 2.5 | Sesión segura | **CERRADA** | Cookie `httpOnly`, refresh silencioso y eliminación del fallback Bearer y de tokens en `localStorage`. |
| 2.6 | Correo real | **CERRADA** | SMTP con Nodemailer; `FileEmailService` solo en desarrollo y pruebas. |
| 2.7 | Portar geo / parcelas | **CERRADA** | CRUD `/plots`, `/plots/nearby`, polígonos validados, centroide y área por PostGIS, autorización por rol. |
| 2.8 | Calidad backend | **CERRADA** | dependency-cruiser, Swagger, seed reproducible, Testcontainers PostGIS, `@swc/jest`, límite de body y CORS. |
| 3 | Requisitos y rediseño frontend | **CERRADA con residual** | F1 router, F2 TanStack Query, F3 `src/shared/ui`, F4 división del marketplace, F5 documentación. Residual: LCP de marketplace 2,83 s y cobertura global de `src`. |
| 4 | Jira: cuenta nueva | **BLOQUEADA** | Requiere sitio, API token y variables de entorno. |
| 5 | Documentos Notion SENA | **BLOQUEADA** | Requiere compartir las plantillas oficiales con la integración. |
| 6 | Sincronización 4 entornos | **PENDIENTE** | Depende de las fases 4 y 5. |
| 7 | Roadmap post-MVP | **BACKLOG** | Fuera del alcance de este sprint. |

### 3.1 Lectura de cierre

Quedaron cerradas las fases **1, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8 y 3**. Permanece parcial **0**; bloqueadas **4 y 5**; pendiente **6**; en backlog **7**.

La afirmación del resumen del PDF según la cual “las fases 0, 1 y 2 están cerradas” debe interpretarse como cierre de los hitos principales de la fase 2, no como cierre total. La propia tabla del PDF ya marcaba la fase 0 como parcial, la 2.4 como parcial, la 2.7 como pendiente y la 2.8 como parcial. El trabajo posterior cerró 2.4, 2.7 y 2.8; la fase 0 sigue parcial por accesos externos.

---

## 4. Entregables verificados

### 4.1 Seguridad P0

| # | Hallazgo | Corrección verificada | Estado |
| --- | --- | --- | --- |
| 1 | Auto-registro como administrador | Rol bloqueado en el contrato Zod; respuesta 422 antes del dominio | Cerrado |
| 2 | Ausencia de `trust proxy` | `trust proxy` configurado por entorno | Cerrado |
| 3 | Rate limit global insuficiente | Limitadores por ruta, incluidos registro y refresh | Cerrado |
| 4 | JWT sin algoritmo fijado | Verificación con `algorithms` explícito | Cerrado |
| 5 | Carrera en rotación de refresh | Transacción atómica con guarda `revoked: false` | Cerrado |
| 6 | P2002 sin mapear | Violación de unicidad traducida a 409 | Cerrado |
| 7 | XSS en `leaflet-geosearch` | Escape de etiquetas de BD y Nominatim | Cerrado |

Controles adicionales incorporados:

- Sesión cookie-only con `HttpOnly`, `Secure` y `SameSite`, sin tokens en `localStorage`.
- Validación de origen para CSRF.
- Correo SMTP real en producción.
- Subida firmada a Cloudinary, sin upload abierto.
- Límite de cuerpo JSON de 32 kB con `413`.
- CORS validado antes del parser.
- `Cache-Control: no-store` en rutas autenticadas.
- `ReturnTo` normalizado contra redirecciones abiertas.
- Separación explícita entre sesión real y modo demo.
- Tokens de verificación y reset eliminados de la URL y protegidos con `Referrer-Policy`.
- Semilla bloqueada en producción y archivos de correo con permisos restrictivos.

### 4.2 Arquitectura y backend

- Monolito modular NestJS 11 sobre Node 24 y Prisma 7.
- PostgreSQL 16 + PostGIS 3.4.
- Contratos Zod compartidos y OpenAPI 3.1 con **17 rutas**.
- Generación de tipos TypeScript desde OpenAPI y guard de asignabilidad en compilación.
- Reglas de dependencia verificadas con dependency-cruiser: **0 violaciones**.
- Swagger disponible en `/docs`.
- Seed reproducible y Testcontainers PostGIS.
- Pino con `correlationId` y filtro global de errores que no expone trazas en 5xx.
- Migraciones: **12**, aplicadas y sincronizadas en desarrollo y pruebas.
- Cutover a NestJS completado; el backend legacy salió del camino de ejecución.

### 4.3 Módulo geoespacial

- CRUD de parcelas con contrato y autorización por rol.
- Búsqueda por proximidad con `ST_DWithin`.
- Centroide y área calculados en PostGIS, no en JavaScript.
- Validación de polígonos: anillo cerrado, mínimo de vértices, máximo, coordenadas dentro de Colombia y área positiva.
- Tres migraciones específicas, índices GIST y restricciones de integridad.
- Pruebas de integración contra PostGIS real.
- Cobertura E2E del flujo geoespacial.

### 4.4 Identidad, perfiles y marketplace

- Registro, login, refresh, logout, verificación y recuperación de contraseña.
- Perfil de productor, empresa y transportista.
- `GET/PATCH /api/v1/profile/me`.
- Endurecimiento P-01: lock asesor de PostgreSQL para la continuidad administrativa, `RolesGuard` registrado en los módulos, `Cache-Control: no-store` en `/admin`, logs sin query PII y bloqueo de cambio de rol sin perfil asociado.
- Administración de usuarios: `GET /admin/users`, `GET /admin/users/:id`, `PATCH /admin/users/:id/status` y `PATCH /admin/users/:id/role`, con búsqueda, filtros, paginación, protección del último administrador y revocación de refresh tokens.
- Marketplace con productos, categorías, imágenes y moderación previa.
- Estados de moderación `pending`, `approved` y `rejected`.
- Panel de moderación con reintento y localización de cultivo.
- Correlación BOLA corregida en la edición de productos.
- Paginación de pendientes con límite y orden estable.
- Subida de imágenes firmada por el backend.

### 4.5 Frontend y experiencia rural

- React Router 7 con rutas protegidas por rol, deep links y retorno seguro.
- TanStack Query con cliente único, invalidación de caché y limpieza al cerrar sesión.
- Sistema de componentes compartidos: botones, inputs, tarjetas, modal accesible, toast, skeleton y estado vacío.
- Shell del marketplace dividido: de 835 a 136 líneas.
- `PropertyMap.tsx` descompuesto y Leaflet fuera del bundle inicial.
- Mapa móvil bajo demanda, sin cargar tiles en el LCP.
- PWA con `vite-plugin-pwa`.
- Accesibilidad: axe sin violaciones en `/login`, `/registro`, `/marketplace` y `/moderacion`, más marketplace móvil.
- Corrección del fallo de producción `L is not defined` y smoke test contra `dist/`.
- Priorización above-the-fold y carga diferida de secciones bajo el pliegue.

### 4.6 Calidad, CI y observabilidad

- CI con Node 24, contratos, arquitectura, cobertura, preview y E2E.
- `check:api-types` para evitar deriva entre contrato y frontend.
- `test:preview` para validar el build real, no solo Vite dev.
- `npm audit` alineado a riesgo aceptado: gate crítico en verde; tres HIGH de la cadena de build de Prisma documentados.
- `no-console` activo, con excepción controlada para desarrollo.
- `ErrorBoundary` con reporter opt-in mediante `VITE_ERROR_REPORT_URL`, sin tokens, query, hash ni PII.
- E2E aislado: sin reutilización de servidores, base `_test` y secretos efímeros.

### 4.7 Documentación y trazabilidad

- README, manifiesto de alineación y Obsidian sincronizados con **462 backend · 155 frontend · 18 E2E**.
- 19 ADRs, incluidos router/datos/UI y tipos OpenAPI.
- Matrices de trazabilidad y decisión D7 documentadas.
- Acta detallada de cierre y plan de fase 3.
- Documentación SENA: **no cerrada**; depende de Notion y de la fase 5.

---

## 5. Métricas de cierre

### 5.1 Pruebas

| Suite | Cantidad | Estado |
| --- | --- | --- |
| API / backend | **462** pruebas en 48 suites | En verde |
| Frontend / web | **155** pruebas en 25 archivos | En verde |
| E2E Playwright | **18** | En verde |
| **Total automatizado** | **635** | En verde |

### 5.2 Cobertura

| Componente | Statements | Branches | Functions | Lines | Lectura |
| --- | --- | --- | --- | --- | --- |
| API | 91,45 % | **80,42 %** | 94,86 % | **91,89 %** | Umbral del 80 % cumplido |
| Frontend — lógica crítica | — | **80,31 %** | — | **92,77 %** | Gate del 80 % cumplido |
| Frontend — todo `src/` | 32,28 % | 28,33 % | 30,03 % | 32,34 % | **Brecha declarada**; pantallas y hooks de mapa/upload no medidos por unitarias |

**Precisión importante:** el frontend no tiene 80 % de cobertura global. Tiene 80 % sobre la lógica crítica seleccionada. Las pantallas, `screenRoutes.tsx`, `useLeafletDraw` y `useImageUpload` quedan fuera del gate unitario y se cubren, total o parcialmente, con E2E. Presentar el 92,77 % como cobertura global sería incorrecto.

### 5.3 Rendimiento y accesibilidad

| Indicador | Resultado | Objetivo | Estado |
| --- | --- | --- | --- |
| Bundle inicial | **109,4 KB gzip** | < 200 KB | Cumple |
| LCP `/` | **2,1 s** | < 2,5 s | Cumple |
| LCP `/marketplace` | **2,83 s** | < 2,5 s | No cumple; residual 0,33 s |
| CLS | **0** | < 0,1 | Cumple |
| Axe WCAG AA | **0 violaciones** en rutas críticas | 0 | Cumple |
| Tareas Turbo | Gates individuales en verde | — | No se recontó el 13/13 histórico |

El LCP de marketplace no lo causa el mapa: el elemento LCP es el `h1` propio. El residual proviene del render delay del entry y del chunk de ruta.

### 5.4 Seguridad y mantenimiento

| Indicador | Resultado |
| --- | --- |
| Hallazgos P0 | 7/7 cerrados |
| Vulnerabilidades HIGH en runtime | 0 |
| Vulnerabilidades HIGH de desarrollo | 3, cadena `prisma → @prisma/config → effect`; sin parche compatible en Prisma 7.x |
| Gate de auditoría | `npm audit --audit-level=critical` en verde |
| Revisión de código y seguridad F1 | Sin hallazgos críticos ni altos; residuales P2 cerrados |

### 5.5 Repositorio

| Indicador | Resultado |
| --- | --- |
| Commits desde el corte del PDF | 127 |
| ADRs | 19 |
| Migraciones | 12 |
| Rutas del contrato | 17 |
| PRs de referencia | #51–#73 |
| Release | `v1.1.2` |

---

## 6. Evidencia reproducible

Comandos ejecutados para el cierre:

```bash
# Calidad del monorepo
npm run lint
npm run typecheck
npm run build

# API
npm test --workspace @agroconnect/api -- --coverage
npm run arch:check --workspace @agroconnect/api
npm run check:drift --workspace @agroconnect/api
npm run alignment -- --ci

# Frontend
npm run test:coverage --workspace agroconnect-frontend
npm run test:preview --workspace agroconnect-frontend
npm run test:e2e --workspace agroconnect-frontend
```

Resultados del corte:

- Lint y typecheck: **0 errores**.
- API: **462/462** pruebas; 48 suites.
- Frontend: **155/155** pruebas; 25 archivos.
- E2E: **18/18** en Chromium.
- Arquitectura: **0 violaciones**.
- Contratos: **sin drift**.
- Alineación: **4 entornos alineados**.
- Build: correcto; PWA con 47 entradas precacheadas.
- Preview smoke: `/` y `/marketplace` renderizan.
- `npm ci --dry-run`: correcto.

---

## 7. Desviaciones respecto al plan y al informe de avance

| ID | Punto | Informe del 28/10 | Cierre real 26/11 | Lectura |
| --- | --- | --- | --- | --- |
| D1 | Total de pruebas | 373 | **635** (462 + 155 + 18) | Crecimiento por port geoespacial, fase 3, a11y y mapa móvil |
| D2 | E2E | 10/10 | **18/18** | Se amplió la cobertura de rutas, mapa móvil y publicación |
| D3 | Fases 0–2 | “cerradas” en el resumen | 0 parcial; 2.4 cerrada con P-01 | Prevalece la tabla granular del propio PDF; el trabajo posterior cerró 2.4 y dejó la fase 0 a la espera de accesos externos |
| D4 | Commit de corte | `588b234` | `2dca6d4` | El repositorio avanzó 131 commits |
| D5 | Rutas del backend | `backend/src/...` | `apps/api/src/...` | Monorepo y cutover a NestJS |
| D6 | Backend | Scaffold NestJS con legacy en paralelo | NestJS canónico; legacy fuera del camino de ejecución | La migración Strangler Fig se completó |
| D7 | Frontend cookie-only | Pendiente | Cerrado | Sin tokens en `localStorage`; refresh silencioso |
| D8 | Geo | Pendiente | Cerrado | CRUD, proximidad, polígonos, PostGIS y E2E |
| D9 | Fase 3 frontend | Pendiente | Cerrada con residual de LCP | F1–F5 completas |
| D10 | Cobertura frontend | No reportada | 92,77 % líneas de lógica crítica; 32,34 % global | El gate mide lógica crítica; la cobertura global sigue siendo deuda |
| D11 | Vulnerabilidades HIGH | 0 | 3 HIGH de desarrollo de Prisma | No hay exposición en runtime; riesgo aceptado y documentado |
| D12 | Despliegue | Preview Vercel y Render arriba | Sin reverificación de producción | Falta `RENDER_API_KEY`; no se declara conformidad |

**Decisión documental:** las desviaciones se registran; no se corrigen sobre el PDF. Este informe y el acta detallada son la lectura vigente para el cierre.

---

## 8. Pendientes y bloqueos

### 8.1 Pendientes de cierre obligatorio

**P-01 cerrado:** administración de usuarios implementada con 28 pruebas nuevas, E2E contra PostgreSQL y contrato OpenAPI. La UI administrativa de usuarios no forma parte de este cierre y queda como pendiente de producto.

| ID | Pendiente | Criterio de aceptación | Responsable | Estado |
| --- | --- | --- | --- | --- |
| P-02 | Despliegue de producción (fase 0/C) | Render con `TRUST_PROXY`, CORS sin localhost, migraciones y smoke de login/productos/perfil | Infraestructura | Bloqueado por API key |
| P-03 | Documentos SENA (fase 5) | PT-ECU-01 v2.0, PT-IGS-01 y PT-MTC-01 conforme a plantilla, con 66 CU y 6 actores | Documentación / SENA | Bloqueado por Notion |
| P-04 | Jira (fase 4) | Sitio nuevo, 17 épicas, 69 HU, sprints históricos y MCP operativo | PO / usuario | Bloqueado |
| P-05 | Sincronización 4 entornos (fase 6) | README, manifiesto, Obsidian y Notion alineados; `alignment --all` en verde | Arquitectura | Pendiente de P-03 y P-04 |

### 8.2 Pendientes de calidad y producto

| ID | Pendiente | Impacto | Acción |
| --- | --- | --- | --- |
| Q-01 | Cobertura global frontend 32,34 % | El gate no mide todas las pantallas | Ampliar pruebas de componentes/pantallas o formalizar excepción |
| Q-02 | LCP marketplace 2,83 s | 0,33 s sobre el objetivo | Atacar render delay del entry y chunk de ruta |
| Q-03 | Cobertura API 80,42 % ramas | Margen estrecho | Añadir pruebas de ramas antes de nuevos módulos |
| Q-04 | 3 HIGH de Prisma en desarrollo | Ruido en auditoría | Revisar con Prisma 8 estable |
| Q-05 | Moderación P2 | Flujo de rechazo incompleto | Decidir motivo, notificación y auditoría |
| Q-06 | Fixture de administrador E2E | Cobertura de moderación limitada | Crear fixture reproducible |
| Q-07 | Límite de Cloudinary | Riesgo de cuota en producción | Verificar plan y fallback |
| Q-08 | D7: renumeración HU | Trazabilidad oficial incompleta | Esperar numeración del Product Backlog v2.0 |
| Q-09 | README de `origin/main` | Desalineado con 635 pruebas | Push/PR autorizado |

---

## 9. Lecciones aprendidas

1. **El E2E contra Vite dev no valida el build real.** El fallo `L is not defined` solo apareció en producción; `test:preview` se volvió obligatorio.
2. **La cobertura debe declarar su alcance.** Un 88 % sobre archivos cargados no equivale a un 80 % global. El gate de lógica crítica es útil, pero no sustituye la cobertura de pantallas.
3. **La seguridad se cierra con pruebas negativas.** Rol administrador, BOLA, refresh reutilizado, redirección abierta y sesión expirada por red necesitan casos explícitos.
4. **La migración Strangler Fig exige cutover verificable.** Mantener dos backends sin un corte claro multiplica rutas y deuda; el cutover a NestJS redujo esa ambigüedad.
5. **Los bloqueos externos deben separarse del trabajo técnico.** Jira, Notion y Render no se resuelven con código; el informe debe distinguir “no entregado” de “bloqueado”.

---

## 10. Concepto de cierre

### 10.1 Concepto técnico

**Procede el cierre técnico del sprint con salvedades.**

Se cumplen los objetivos de:

- Corregir la seguridad P0.
- Consolidar un backend modular defendible.
- Portar geoespacial a PostGIS.
- Entregar la base frontend y el marketplace usable.
- Dejar gates reproducibles y documentación técnica alineada.

### 10.2 Concepto institucional

**No procede el cierre institucional completo.**

No están cerrados:

- Los documentos SENA en Notion.
- Jira y la reconstrucción Scrum.
- La verificación de producción en Render.
- La cobertura global del frontend.

### 10.3 Recomendación

1. Declarar cerrado el sprint técnico con este informe y el acta detallada.
2. Mantener abiertos P-02 a P-05 con los responsables indicados.
3. No presentar los módulos post-MVP como implementados.
4. No afirmar cobertura global del 80 % en frontend.
5. Resolver primero P-02 y P-03 si el objetivo es la entrega institucional.

---

## 11. Aprobaciones

| Rol | Nombre | Firma | Fecha |
| --- | --- | --- | --- |
| Elaboró — Arquitectura / Desarrollo |  |  |  |
| Revisó — QA |  |  |  |
| Aprobó — Instructor SENA |  |  |  |
| Aprobó — Líder de proyecto |  |  |  |

---

## Anexo A. Commits representativos del cierre

| Commit | Ámbito | Contenido |
| --- | --- | --- |
| `5423e52` | Seguridad | Siete hallazgos P0 |
| `ae1ffc2` | Arquitectura | ADRs 008–015 y workflow |
| `6326ecc` | Monorepo | Workspaces, contratos y CI |
| `8b5e6bc` | Backend | Scaffold NestJS |
| `0c5a88b` | Identidad | Dominio y ocho casos de uso |
| `5267e8b` | Sesión | Frontend cookie-only |
| `9c4e762` | Geo | Port del módulo geography |
| `84db165` | Perfiles | `GET/PATCH /profile/me` |
| `d53e30c` | Marketplace | Cloudinary firmado y corrección BOLA |
| `5c80252` | Moderación | Estados y endpoints administrativos |
| `9d884c2` | Geo | CRUD de parcelas y PostGIS |
| `eac538e` | Calidad | dependency-cruiser, Swagger, seed y Testcontainers |
| `6e93652` | Frontend | Router y URLs |
| `5c41fea` | Frontend | TanStack Query |
| `7b00dbc` | Frontend | Sistema de componentes y axe |
| `f446c5d` | Frontend | División del marketplace |
| `9fbe7d8` | Producción | Fix `L is not defined` y smoke preview |
| `26167f4` | Rendimiento | Priorización above-the-fold |
| `267b8cf` | Rendimiento | Leaflet diferido y mapa móvil |
| `b63cc6f` | Contratos | Tipos OpenAPI |
| `a0665dd` | Observabilidad | Reporter opt-in |
| `6c34572` | Calidad | Cobertura de lógica crítica |

## Anexo B. Fuentes

| Fuente | Ubicación |
| --- | --- |
| Informe de avance | `AgroConnect_Estado_Avance_Sprint_2026-10-28.pdf` |
| Plan autorizado | Plan de trabajo — AgroConnect |
| Acta detallada | `docs/acta-cierre-sprint-2026-10-28.md` |
| Manifiesto | `tools/alignment-check/manifest.json` |
| ADRs | `docs/adr/` |
| Matrices | `docs/matriz_trazabilidad_*.md` y `*.csv` |
| Repositorio | `https://github.com/AgroConnect-superapp-fp/AgroConnect` |
| Aplicación | `https://agroconnectpreview.vercel.app` |
| API | `https://agroconnect-api-5t7n.onrender.com` |
| Obsidian | `~/Documents/Obsidian Vaults/Ningendo Bee/AgroConnect/` |

## Anexo C. Glosario

| Término | Definición |
| --- | --- |
| ADR | Registro de decisión arquitectónica y sus consecuencias. |
| BOLA | Fallo de autorización a nivel de objeto. |
| CU | Caso de uso. |
| D7 | Decisión de equivalencias entre HU y CU. |
| E2E | Prueba de extremo a extremo. |
| HU | Historia de usuario. |
| LCP | Largest Contentful Paint; métrica de carga percibida. |
| P0 | Prioridad máxima. |
| PostGIS | Extensión geoespacial de PostgreSQL. |
| RF / RNF | Requisito funcional / no funcional. |
| SSOT | Fuente única de verdad. |

---

**Fin del informe.**  
Versión 2.2 — 26/11/2026. Cierre técnico con salvedades; las firmas y los trámites externos permanecen pendientes.
