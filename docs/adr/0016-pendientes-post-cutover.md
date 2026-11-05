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
- **Estado:** implementada el 2026-11-02 con migración
  `20261103000000_add_refresh_token_family`, revocación de familia y prueba de
  reuso. La migración debe aplicarse en la base nueva con `prisma migrate deploy`.

### D4. Argon2id

- **Situación:** el ADR-010 lo exige, pero los 11 usuarios de desarrollo usan
  bcrypt (`$2b$`).
- **Estado:** implementada el 2026-11-02 con `@node-rs/argon2`, fallback bcrypt
  y rehash transparente en el login. Pruebas de hash, comparación y migración.

### D5. Verificación de correo antes de emitir sesión

- **Situación:** el registro emite cookies sin esperar `emailVerifiedAt`.
- **Opciones:** bloquear la sesión hasta verificar o permitir una sesión
  limitada (solo perfil y reenvío).
- **Estado:** implementada el 2026-11-02 con **bloqueo total**: el registro no
  emite cookies; login y refresh devuelven 403 `EMAIL_NOT_VERIFIED` hasta que
  `emailVerifiedAt` exista. El E2E verifica el correo antes del login.
  `SMTP_HOST` es obligatorio en producción: sin él la API no arranca, porque el
  `FileEmailService` dejaría el enlace en `/tmp` y nadie podría verificar.

### D6. `iss`/`aud` en JWT

- **Situación:** los tokens no llevan emisor ni audiencia.
- **Estado:** implementada el 2026-11-02. Los tokens nuevos llevan `iss` y
  `aud`; los antiguos (sin claims) dejan de ser válidos, por lo que los usuarios
  deben iniciar sesión de nuevo.

### D7. Matrices de trazabilidad

- **Situación:** `matriz_trazabilidad_cu_hu.csv` tiene 74 relaciones y el
  total oficial es 69 HU/66 CU; `detalle` tiene 203 filas.
- **Estado:** aprobada por Fabián Gallego el **2026-11-05**. M17 corregido:
  HU70–HU76 (inexistentes) reemplazadas por HU61–HU67 con CU#66. La tabla de
  equivalencias aprobada mapea HU06→HU14, HU15→HU08 y HU04→HU11; HU33→CU#31.
  HU08, HU28 y HU30 siguen sin equivalencia explícita en el SSOT.
- **Hallazgo Notion:** solo HU33 está en la matriz detallada (RF-33 → CU#31).
  El Anexo de Equivalencias advierte que HU06→HU14, HU15→HU08 y HU04→HU11
  pertenecen a una renumeración **v0.1 pendiente de aprobación**; no se debe
  propagar todavía.
- **Recomendación:** aprobar la tabla de equivalencias con Product Owner e
  instructor, luego regenerar CSV y matriz; no inferir relaciones.
- **Evidencia:** `docs/matriz_trazabilidad_hallazgos.md` § Consulta a Notion.
- **Criterio:** `traceability-check` sin discrepancias y matriz firmada.

### D8. Release y dependencias

- **Estado:** tag y **release `v1.1.0` publicados** (2026-11-02) con las notas
  del CHANGELOG. Quedan **2 alertas** de Dependabot (minimatch medium,
  deepmerge low), ambas en dependencias de desarrollo; sus fixes exigen
  `@nestjs/cli@12` y `typescript-eslint` con cambio mayor, así que requieren
  una ventana de pruebas (`npm audit fix --force` no se aplicó).
- **Criterio:** release publicada, `npm audit --audit-level=high` verde y CI
  estable. El último punto queda pendiente de la ventana de Dependabot.

### D9. Contraste del accent yellow

- **Estado:** Resuelto 2026-11-03.
- **Situación histórica:** el design system usa `#F9A825` (accent) con texto
  blanco en varios botones; el contraste era ≈1.97:1, por debajo de WCAG AA.
  El badge "Top" se corrigió a `text-amber-950` (≈7:1), pero la deuda sistémica
  seguía.
- **Implementación:** se añadieron `--color-on-accent` (`#1a1a1a`, 8.83:1 sobre
  el accent), `--color-agro-yellow-soft` (`#ffd54f`, 5.58:1 sobre `agro-dark`)
  y `--color-agro-yellow-ink` (`#b45309`, 5.02:1 sobre blanco). `Button`
  secondary y el toggle de zonas productivas usan `text-on-accent`; los textos
  accent sobre fondos oscuros usan `soft` y sobre fondos claros usan `ink`.
  No se cambió el color de marca.
- **Validación:** contraste calculado; lint/build/E2E.
- **Gate CI (2026-11-03):** `frontend/e2e/a11y.spec.ts` ejecuta axe WCAG 2.1
  A/AA sobre marketplace y modal. Detectó y corrigió contrastes de badges de
  cultivo, productividad, botón de reintento y el nombre accesible del dropzone.
  Lighthouse PWA sigue como gate separado.
- **Criterio:** 4.5:1 en texto normal y 3:1 en texto grande en todos los
  botones/chips con accent (cumplido en los pares medidos).

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
