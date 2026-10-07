# Changelog — AgroConnect

Todos los cambios notables de este proyecto se documentan en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

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
