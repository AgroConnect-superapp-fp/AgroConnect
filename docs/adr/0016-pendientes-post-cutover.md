# ADR-016: Pendientes post-cutover — decisiones para el siguiente ciclo

- **Estado**: Propuesta — D1 implementada (2026-11-02)
- **Fecha**: 2026-11-02
- **Decisores**: Equipo AgroConnect
- **Relacionado**: ADR-009 (NestJS), ADR-010 (sesión), ADR-015 (monorepo), auditoría 2026-11-02

## Contexto

El cutover a `apps/api` (NestJS) está desplegado y verificado: Vercel sirve el
bundle nuevo con CSP, Render ejecuta NestJS con `CsrfGuard` y el readiness
existe. La base de producción (Supabase) está caída, lo que bloquea la
verificación de login/RLS, pero no impide decidir y preparar el siguiente
ciclo. Este ADR registra las decisiones que **no** se tomaron en la Fase 0 y
que requieren criterio de producto o arquitectura.

## Decisiones pendientes

### D1. PWA: implementar o retirar

- **Situación:** existe `frontend/public/sw.js` pero no hay manifest ni
  registro; el README ya no promete PWA. El valor rural-first (conectividad
  intermitente) es real.
- **Opciones:**
  1. Implementar con `vite-plugin-pwa` (Workbox): manifest, iconos, precache
     del shell y `stale-while-revalidate` para imágenes.
  2. Retirar `sw.js` y no prometer offline; el modo demo cubre la caída.
- **Estado:** Implementada el 2026-11-02 con `vite-plugin-pwa` (Workbox):
  manifest, iconos 192/512/maskable, precache del shell y `runtimeCaching` de
  Cloudinary/tiles. No se cachean respuestas de autenticación.
- **Criterio pendiente:** Lighthouse PWA instalable y E2E de carga offline.

### D2. Retiro del backend Express legacy

- **Situación:** `backend/` y `apps/api/` coexisten; Render ya sirve
  `apps/api`. El legacy conserva 188 pruebas y duplica el dominio.
- **Opciones:**
  1. Retirarlo ya y dejar un único backend.
  2. Mantenerlo como referencia hasta cerrar la paridad de todos los módulos.
- **Estado:** implementada el 2026-11-02. `backend/` eliminado; el esquema y
  las migraciones Prisma se movieron a `apps/api/prisma`; CI, rulesets, scripts
  y documentación actualizados. La paridad funcional la cubren los 198 tests
  de `apps/api` y el E2E.
- **Criterio cumplido:** `grep` sin imports desde `apps/*` a `backend/*`; CI
  sin el job `backend`.

### D3. Familias de refresh tokens

- **Situación:** `refresh_tokens` no tiene `family_id`/`generation`; un token
  rotado reutilizado no revoca la familia.
- **Recomendación:** añadir `family_id` (UUID), `generation` (int) y
  `rotated_at`; al detectar reuso, revocar toda la familia en una transacción.
- **Criterio:** migración reversible, prueba de reuso concurrente y alerta de
  seguridad cuando se detecte.

### D4. Argon2id

- **Situación:** el ADR-010 lo exige, pero los 11 usuarios de desarrollo usan
  bcrypt (`$2b$`).
- **Recomendación:** Argon2id para hashes nuevos y rehash transparente en el
  login exitoso; mantener bcrypt para verificar los existentes.
- **Criterio:** dependencia `argon2` con binario prebuilt, pruebas de rehash y
  migración sin bloquear el login.

### D5. Verificación de correo antes de emitir sesión

- **Situación:** el registro emite cookies sin esperar `emailVerifiedAt`.
- **Opciones:** bloquear la sesión hasta verificar o permitir una sesión
  limitada (solo perfil y reenvío).
- **Recomendación:** sesión limitada; no romper el flujo de registro ni los
  E2E, pero impedir operaciones sensibles (publicar, comprar, cambiar rol).
- **Criterio:** matriz de permisos por `verificado` y prueba E2E.

### D6. `iss`/`aud` en JWT

- **Situación:** los tokens no llevan emisor ni audiencia.
- **Recomendación:** añadirlos y aceptar una ventana de transición con
  `issuer`/`audience` opcionales; invalidar sesiones fuera de la ventana.
- **Criterio:** tokens viejos siguen funcionando durante el despliegue; los
  nuevos se validan estrictamente.

### D7. Matrices de trazabilidad

- **Situación:** `matriz_trazabilidad_cu_hu.csv` tiene 74 relaciones y el
  total oficial es 69 HU/66 CU; `detalle` tiene 203 filas.
- **Estado:** parcialmente implementada (2026-11-02). M17 corregido:
  HU70–HU76 (inexistentes) reemplazadas por HU61–HU67 con CU#66. Quedan 6 HU
  sin CU (HU06, HU08, HU15, HU28, HU30, HU33) para validar en Notion.
- **Recomendación:** reconciliar contra Notion (fuente SSOT), marcar duplicados
  o HU mal clasificadas y regenerar los CSV con el script.
- **Criterio:** `traceability-check` sin discrepancias y matriz firmada.

### D8. Release y dependencias

- **Situación:** el CHANGELOG ya tiene `1.1.0`, pero no hay tag/release; hay 10
  alertas de Dependabot en la rama por defecto (7 moderate, 3 low) y el lockfile
  es único.
- **Recomendación:** crear `v1.1.0` con las notas del CHANGELOG; actualizar
  Dependabot en un PR separado, empezando por parches de seguridad y evitando
  majors de Vite/React sin ventana de pruebas.
- **Criterio:** release publicada, `npm audit --audit-level=high` verde y CI
  estable.

### D9. Contraste del accent yellow

- **Situación:** el design system usa `#F9A825` (accent) con texto blanco en
  varios botones; el contraste es ≈1.97:1, por debajo de WCAG AA. El badge
  "Top" se corrigió a `text-amber-950` (≈7:1), pero la deuda sistémica sigue.
- **Recomendación:** definir un token `--color-on-accent` (casi negro) y
  aplicarlo a todo componente con fondo `agro-yellow`; validar con axe o
  Lighthouse. No cambiar el color de marca.
- **Criterio:** 4.5:1 en texto normal y 3:1 en texto grande en todos los
  botones/chips con accent.

## Consecuencias

- **Positivas:** el siguiente ciclo tiene alcance y criterios explícitos; no se
  mezclan cambios de producto con el cutover.
- **Negativas:** la deuda de refresh/Argon2 y la PWA siguen abiertas mientras
  la base de producción no se restaure.
- **Dependencia externa:** D3, D4 y la verificación de login requieren Supabase
  operativo; D1, D2, D6, D7 y D8 pueden avanzar sin él.

## Orden sugerido

1. Restaurar Supabase y cerrar RLS/login (bloqueo externo).
2. D2 (retiro del legacy) y D8 (release) para reducir superficie.
3. D3/D4 (seguridad de sesión) con migración controlada.
4. D1 (PWA) y D5 (verificación) según prioridad de producto.
5. D6/D7 en el siguiente sprint.
