# Auditoría de Retoma — AgroConnect

**Fecha:** 2 de octubre de 2026
**Proyecto:** AgroConnect — Plataforma B2B+B2C agropecuaria (SENA ADSO, Ficha 3292136)
**Metodología:** RUP + Scrum
**Alcance:** auditoría integral del repositorio, del software ejecutable, de la documentación SENA y del SSOT Notion; diagnóstico de entornos; plan de retoma priorizado.
**Método:** verificación ejecutable (lint, typecheck, pruebas unitarias/integración, E2E, build, auditoría de seguridad, consultas SQL y API de Notion vía MCP) contrastada contra la documentación del proyecto y las matrices de trazabilidad.

---

## 1. Resumen ejecutivo

El proyecto está en un estado **avanzado y verificable**: el Incremento 1 (M02 — registro y autenticación; RF-05, CU#01, HU01) está construido, probado y documentado. El SSOT documental (Notion) está **completo e íntegro** y coincide al 100% con los artefactos locales (68 RF, 30 RNF, 66 CU, 69 HU, 17 módulos, 6 actores).

La brecha actual **no es documental ni de producto**, sino de **integración operativa**:

1. Tres ramas paralelas con piezas complementarias sin integrar.
2. Una migración espuria que elimina el índice espacial GIST (aplicada en la BD de desarrollo).
3. Credenciales y remotos por alinear (token GitHub expirado; repositorio canónico divergente).
4. Entornos (dev/test) desalineados respecto a la carpeta de migraciones.

Ninguno de estos puntos bloquea el avance una vez ejecutado el saneamiento P0 definido en la sección 7.

**Veredicto técnico:** el software del Incremento 1 cumple los umbrales de calidad del SPEC (cobertura ≥ 80%, 0 errores de lint/typecheck, 0 vulnerabilidades críticas) y la trazabilidad documental está validada al 100%.

---

## 2. Estado verificado del sistema

### 2.1 Software — evidencia ejecutable (2 de octubre de 2026)

| Verificación | Comando | Resultado |
|---|---|---|
| Lint backend | `npm run lint` | 0 errores |
| Typecheck backend | `npm run typecheck` | 0 errores |
| Pruebas backend | `npm test -- --coverage` | **111/111 en verde** |
| Cobertura backend | — | 95.89% statements · 82.22% branches · 94.28% functions · 96.06% lines (umbral: 80%) |
| Lint frontend | `npm run lint` | 0 errores |
| Typecheck + build frontend | `npx tsc -b && npm run build` | 0 errores · build en 1.19 s |
| E2E | `npm run test:e2e` (Playwright) | **4/4 en verde** (registro→login→panel, correo duplicado, credenciales inválidas, validación de formulario) |
| Seguridad backend | `node scripts/security-audit.mjs backend` | 0 críticas · 3 altas en allowlist documentada (dev-only) |
| Seguridad frontend | `node scripts/security-audit.mjs frontend` | 0 vulnerabilidades |

### 2.2 Base de datos PostgreSQL 16 + PostGIS 3.4

| Elemento | Estado |
|---|---|
| Contenedor `agroconnect-postgres` (puerto 5434) | Operativo (estaba detenido; se arrancó para la auditoría) |
| Tablas | `users`, `roles`, `producer_profiles`, `company_profiles`, `refresh_tokens` |
| Catálogo de roles | 5 roles sembrados (productor, comprador_b2c, comprador_b2b, transportista, administrador) |
| Migración `20260928041427_init_auth` | Aplicada en dev y test |
| Índice GIST de `producer_profiles.coordenadas` | **Ausente en dev** (hallazgo H1); presente en test |
| Divergencia dev/test | dev: `init_auth` + migración espuria; test: `init_auth` + `add_plots` (no existe en la carpeta de migraciones de la rama actual) |

### 2.3 Arquitectura de código

- **Backend:** Clean Architecture verificada — `domain` sin dependencias externas, `application` solo importa `domain`, `infrastructure` implementa interfaces, `presentation` compone; `PrismaClient` confinado a infraestructura y `shared`; composition root en `app.ts`.
- **Frontend:** React 19.2 + Vite 8 + TypeScript 6 + Tailwind 3; pantallas de auth con wizard multi-rol; `MarketplacePrototype` con Leaflet/OpenStreetMap (lazy loading); cliente API propio (`authClient.ts`) con tipado y manejo de errores.
- **Prohibiciones del SPEC:** cumplidas en el código auditado (sin `any` en producción, sin `console.log` en backend, sin secretos trackeados, sin Google Maps, operaciones geoespaciales vía PostGIS).

---

## 3. Repositorio, ramas y remotos

### 3.1 Estado de git

| Elemento | Detalle |
|---|---|
| Rama activa | `feature/m02-auth-increment-1` (5 commits sobre `main`) |
| Ramas existentes | `main`, `feature/m02-auth` (4 commits propios), `feature/m16-geolocation` (3 commits propios), `feature/m02-auth-increment-1` |
| Rama `develop` | **No existe** (el SPEC define Git Flow simplificado con `develop`) |
| Remoto local | `origin → github.com/fabiansuez182iii-boop/agroconnect` |
| Remoto en Notion | Organización `github.com/AgroConnect-superapp-fp` (existe; sin repos públicos visibles) |
| Divergencia | **H6:** el SSOT apunta a la organización del equipo; el clon local apunta a un repositorio personal |
| Pendientes sin commitear | `.opencode` (modelos IA actualizados), skill `screenshot-capture`, PDFs 01–06 regenerados, migración espuria (cuarentenada en esta auditoría), `frontend/capturas-tmp.mjs` |

### 3.2 Contenido diferencial por rama

| Rama | Aporta | Le falta |
|---|---|---|
| `feature/m02-auth-increment-1` | Incremento 1 final, entregables 01–06, matrices, scripts, auditoría | Fix de anon key Supabase, migración `add_plots`, tests y CI de M16 |
| `feature/m02-auth` | Backend auth base, pantallas, fix Supabase, CI/MCP Jira | Docs del incremento, scripts, versión final de pantallas |
| `feature/m16-geolocation` | Módulo geography completo (Plot, UseCase, repositorio PostGIS, rutas, migración con GIST, 6 archivos de test), fix Supabase | Docs del incremento, scripts, versión final de pantallas |

El módulo `backend/src/modules/geography/` presente en la rama activa está **huérfano**: sin migración, sin rutas montadas en `app.ts` y sin pruebas. Se activa al integrar `feature/m16-geolocation`.

---

## 4. Documentación y SSOT

### 4.1 Notion (verificado vía MCP el 2 de octubre de 2026)

Workspace "Espacio de AgroConnect" — página raíz `1d7bdc33f29483caadf20189d8ee9b19`:

| Documento | Versión / Estado | Verificación |
|---|---|---|
| PT-PP-01 Planteamiento del Problema | Publicado | Existencia confirmada |
| PT-ERS-01 Especificación de Requisitos | **v1.4 OFICIAL** (19-may-2026) | **68 RF (1–68 sin faltantes) · 30 RNF (1–30 sin faltantes) · 17 módulos · 6 actores** |
| PT-ECU-01 Especificación Casos de Uso | **v1.1 OFICIAL** (20-may-2026) | 6 actores · 17 subsistemas · diagramas M01–M12 elaborados; M13–M17 marcados "pendientes Sprint 7" (H11) |
| PT-PS-01 Prototipado del Sistema | Publicado | Existencia confirmada |
| PT-IGS-01 Informe General del Sistema | Publicado | Existencia confirmada |
| PT-PP-02 Plan de Pruebas | Publicado | Existencia confirmada |
| PT-MTC-01 Manual Técnico de Configuración | Publicado | Existencia confirmada |
| PT-MU-01 Manual de Usuario | Publicado | Existencia confirmada |
| PT-AR-ARQ-01 Informe de Arquitectura Tecnológica | v1.0 OFICIAL | Existencia confirmada |
| PT-AUD-02 Informe de Auditoría Documental | v1.0 | Existencia confirmada |
| PT-FIX-02 Plan de Corrección Integral | v1.0 | Existencia confirmada |
| PT-FIX-01 (versión anterior) | [DEPRECATED] | Correctamente marcado |
| Matriz de Trazabilidad RF↔CU↔HU | v2.0 (03-jul-2026) | 100% mapeado · 0 relaciones débiles · idéntica a la local |
| Base "Relación Módulos con Casos de Uso" | 66 registros | Distribución por módulo idéntica a la local |
| Base "Product Backlog — Desarrollo" (HU) | 69 registros | Distribución por módulo idéntica a la local |
| Base "Lista Actas del Proyecto" | 62 actas | Sprints 1–9, actas extraordinarias y de corrección |

### 4.2 Verificación cuantitativa contra el contrato del SPEC

| Artefacto | Esperado | Verificado en Notion | Estado |
|---|---|---|---|
| Módulos | 17 | 17 | ✅ |
| RF | 68 | 68 | ✅ |
| RNF | 30 | 30 | ✅ |
| CU | 66 | 66 | ✅ |
| HU | 69 | 69 | ✅ |
| Actores | 6 | 6 | ✅ |

### 4.3 Artefactos locales

- `docs/matriz_trazabilidad_completa.md` (v2.0) y 5 CSV derivados: coherentes con Notion.
- `docs/actividades/entregables/` — 9 documentos (01–09), incluido PT-IGS-01 y guion de video.
- `docs/verificacion-incremento-1.md` — auditoría de cumplimiento de los entregables 01–06, ratificada por esta auditoría.
- `docs/resumen_completo_proyecto.md` + PDF — consolidación del proyecto (corte 31-jul-2026).
- PDFs 01–06 — regenerados con capturas del sistema en ejecución (skill `screenshot-capture`).

### 4.4 Obsidian y Jira

- **Obsidian** (`~/Documents/Obsidian Vaults/Ningendo Bee/AgroConnect/`): 13 notas activas — PT-AUD-02, PT-FIX-01/02/03, plan de auditoría S7–S9, convenciones UML, plantillas. Estructura correcta (Requisitos/, Casos de Uso/, Decisiones Técnicas/, Sprints/).
- **Jira** (`SCRUM`): pendiente de verificación en esta sesión (la instancia respondió "site unavailable" en el primer intento). Reintentar con el MCP operativo.

---

## 5. Matriz consolidada de hallazgos

| ID | Área | Severidad | Hallazgo | Estado |
|---|---|---|---|---|
| H1 | Datos / PostGIS | Crítico | Migración espuria `20260928062141` elimina el índice GIST; aplicada en dev y sin trackear en git | **En saneamiento (P0)** |
| H2 | Seguridad | Crítico | Anon key de Supabase hardcodeada como fallback en `frontend/src/services/supabase.ts`; el fix existe en otras ramas pero no en la activa. La clave estuvo expuesta → rotar | Pendiente (P1) |
| H3 | Datos | Alto | BD test con migración fantasma `add_plots` (no existe en la carpeta de la rama); BD dev sin tabla `plots` | Pendiente (P1) |
| H4 | Entorno | Alto | MCP sin variables por arranque sin direnv; Notion resuelto, Jira por verificar | Parcialmente resuelto |
| H5 | Workspace | Medio | ~140 MB de artefactos basura en `frontend/` (`react` 91 MB, `leaflet` 39 MB, etc.) + `capturas-tmp.mjs` temporal | Pendiente (P0, requiere aprobación) |
| H6 | Repositorio | Crítico | Remoto canónico divergente: Notion → organización `AgroConnect-superapp-fp`; local → repo personal | **Diagnóstico en curso (P0)** |
| H7 | Entorno | Alto | `GITHUB_PERSONAL_ACCESS_TOKEN` expirado/revocado (verificado vía API: "Bad credentials") | Pendiente (P0, requiere nuevo PAT) |
| H8 | Documental | Medio | Versionado inconsistente: página de matriz v2.0 vs referencias "Matriz v4.0 OFICIAL" en PT-ECU-01/PT-ERS-01 | Pendiente (P1) |
| H9 | Documental | Bajo | Nota obsoleta en matriz local sobre "HU69–HU76"; en Notion M17 tiene HU61–HU69 definitivas | Pendiente (P1) |
| H10 | Documental | Medio | Prioridades de HU con 6 taxonomías MoSCoW mezcladas | Pendiente (P2) |
| H11 | Documental | Medio | Diagramas UML de M13–M17 declarados "pendientes Sprint 7" sin evidencia de cierre | Pendiente (P2) |
| H12 | Documental | Aclaración | 29 CU "Finalizado" en Notion = especificación documental; en código solo M02 está implementado | Documentado |
| H13 | Documental | Bajo | PT-ECU-01 menciona "seis tipos de usuarios" en M02; el registro real tiene 5 roles | Pendiente (P1) |

---

## 6. Deuda técnica vigente

Deuda registrada previamente (ratificada) más la nueva:

| Elemento | Origen | Acción |
|---|---|---|
| Prototipo del marketplace usa Supabase (PostgREST) en lugar de la API propia | README / H2 | Migrar a `/api/v1` en el incremento de catálogo |
| Verificación por correo y recuperación completa de contraseña | T6 declarado | Definir proveedor y plantilla |
| Perfiles específicos de comprador empresa y transportista | T6 declarado | Campos adicionales en registro |
| Advisory GHSA-ggr8-5vv4-36mx (`deepmerge-ts` vía Prisma CLI, dev-only) | Allowlist | Riesgo aceptado; revisar en cada actualización de Prisma |
| Ramas sin integrar y ausencia de `develop` | H3 / §3 | Integrar en P1 |
| Migración espuria GIST | H1 | Saneada en P0 (este documento) |

---

## 7. Ruta de retoma priorizada

### P0 — Saneamiento y credenciales

1. **Diagnóstico del remoto (H6):** evidencia recogida y decisión de repositorio canónico (organización del equipo vs repo personal).
2. **Limpieza de la migración GIST (H1):** cuarentenar carpeta espuria, eliminar su registro en `_prisma_migrations` y recrear el índice GIST en dev.
3. **Token GitHub (H7):** regenerar PAT con scope `repo`, actualizar `.env`, `direnv reload` y relanzar OpenCode.
4. **Commits de pendientes legítimos:** skill `screenshot-capture`, `.opencode` (modelos), PDFs regenerados.
5. **Limpieza de basura en `frontend/` (H5):** requiere aprobación explícita (comando de borrado).

### P1 — Integración técnica y documental

6. Crear `develop` e integrar en orden: `feature/m16-geolocation` → `feature/m02-auth-increment-1` → fix Supabase (H2/H3). Resolver conflictos en `app.ts`, migraciones y CI.
7. Alinear entornos: `migrate deploy` en dev y test; verificar índice GIST y `plots`.
8. Sincronizar versiones y notas (H8/H9/H13) en Notion y artefactos locales.
9. Push de `develop` al remoto canónico con PR hacia `main` (tras decisión H6).

### P2 — Calidad documental y producto

10. Normalizar prioridades MoSCoW (H10) y cerrar diagramas UML M13–M17 (H11).
11. Continuar T6: verificación por correo, perfiles empresa/transportista.
12. Migrar `MarketplacePrototype` a la API propia (M03/M16) y ampliar E2E a los flujos del SPEC.

---

## 8. Verificación reproducible

```bash
# Base de datos
docker start agroconnect-postgres
docker exec agroconnect-postgres psql -U agroconnect -d agroconnect_dev -c "\di producer_profiles*"

# Backend
cd backend && npm run lint && npm run typecheck && npm test -- --coverage

# Frontend
cd frontend && npm run lint && npx tsc -b && npm run build && npm run test:e2e

# Seguridad
node scripts/security-audit.mjs backend && node scripts/security-audit.mjs frontend

# Migraciones
cd backend && npx prisma migrate status
```

---

## 9. Registro de la auditoría

| Elemento | Valor |
|---|---|
| Fecha | 2 de octubre de 2026 |
| Herramientas | OpenCode CLI 1.18.34 · MCP Notion · Playwright · Jest · ESLint · Prisma · PostgreSQL 16/PostGIS 3.4 |
| Fuentes | Repositorio local, Notion (SSOT), Obsidian, PDFs de entregables, bases de datos dev/test |
| Autoría | Auditoría técnica asistida por IA (equipo de ingeniería OpenCode) bajo dirección del Scrum Master |
| Próxima revisión | Al cierre del P1 (integración de ramas) |

---

## 10. Registro de ejecución del plan de retoma

**Ejecutado el 2 de octubre de 2026 (misma fecha de la auditoría).**

### P0 — Saneamiento y credenciales

| Acción | Estado | Evidencia |
|---|---|---|
| Documento de auditoría materializado | Completado | `docs/auditoria-retoma-2026-10-02.md` |
| Diagnóstico del remoto (H6) | Completado | Repo personal público (HTTP 200) y accesible; org `AgroConnect-superapp-fp` sin acceso anónimo. Decisión: org como `origin`, repo personal conservado como remoto `personal` |
| Migración espuria GIST (H1) | Completada | Carpeta en cuarentena (`/tmp/opencode/cuarentena-migracion-espuria/`), registro eliminado de `_prisma_migrations`, índice `producer_profiles_coordenadas_gist_idx` recreado; `prisma migrate status` limpio |
| Prevención anti-DROP documentada | Completada | Reglas añadidas en `docs/guia-arranque-postgis.md` y `backend/README.md` |
| Commits de pendientes legítimos | Completados | 3 commits: auditoría, configuración OpenCode + skill de capturas, PDFs regenerados |
| Token GitHub (H7) | Pendiente del usuario | Regenerar PAT con scope `repo` y actualizar `.env` |
| Limpieza de basura en `frontend/` (H5) | Pendiente del usuario | Comando de borrado entregado (`rm` bloqueado por política del agente) |
| Rotación de anon key Supabase (H2) | Pendiente del usuario | La clave estuvo pública en el historial del repo personal |

### P1 — Integración de ramas (completada en local)

| Acción | Estado | Evidencia |
|---|---|---|
| Rama `develop` creada | Completada | Desde `feature/m02-auth-increment-1` |
| Merge de `feature/m16-geolocation` | Completado | 5 conflictos resueltos: `app.ts` (auth + plots), `schema.prisma` (+ modelo Plot), `supabase.ts` (fix sin fallback), `ci.yml` (pipeline completo), `presentation.test.ts` (unión de suites) |
| Fix de credenciales Supabase (H2) | Aplicado | `frontend/src/services/supabase.ts` falla con mensaje claro si faltan variables; sin clave hardcodeada |
| Verificación integral | Completada | Backend: 146/146 pruebas, cobertura 96.77% statements · 87.91% branches; Frontend: lint/typecheck/build OK; E2E 4/4 |
| Migración `add_plots` aplicada a dev | Completada | Índices GIST presentes en `plots` y `producer_profiles`; `migrate status` limpio |
| Push al remoto canónico | Pendiente | Requiere PAT con acceso a la organización |
| Sincronización documental (H8/H9/H13) | Pendiente | Versiones y notas por unificar en Notion y artefactos locales |
| Normalización MoSCoW (H10) y UML M13–M17 (H11) | Pendiente | Planificado para P2 |

---

## 11. Seguimiento post-publicación (3 de octubre de 2026)

### 11.1 Publicación en GitHub

| Acción | Estado | Evidencia |
|---|---|---|
| Push de `develop` a la organización | Completado | `origin` → `AgroConnect-superapp-fp/AgroConnect` (repo privado; case del remoto corregido) |
| Pull Request #1 `develop → main` | Abierto | https://github.com/AgroConnect-superapp-fp/AgroConnect/pull/1 |
| CI completo en verde | Completado | Backend ✅ · Frontend ✅ · E2E ✅ (commit `dcd81a4`) |
| Incidente CI 1: advisory `GHSA-vfj7-8cjw-p6xm` (`braces`, sin fix upstream) | Resuelto | Allowlist documentada en el gate y README (dev-only, sin exposición) — commit `66cf085` |
| Incidente CI 2: JWT faltantes en el backend del E2E | Resuelto | Secretos de prueba añadidos en `playwright.config.ts` — commit `dcd81a4` |
| Limpieza de binarios trackeados por error | Completado | Commit de eliminación de `frontend@0.0.0` y `react-leaflet-markercluster` (78.158 líneas) |

### 11.2 Verificaciones de seguridad y entorno

| Acción | Estado | Evidencia |
|---|---|---|
| Rotación de la anon key de Supabase | **Completada por el usuario** | La clave antigua responde HTTP 401 (invalidada) |
| Backup de seguridad de la historia | Completado | Mirror en `/tmp/opencode/agroconnect-backup-20261003.git` |
| `gh` CLI | Pendiente del usuario | `GITHUB_TOKEN` global inválido precede a la configuración de `gh`; solución: `unset GITHUB_TOKEN && gh auth login` |
| Plan de limpieza de historia | Documentado | `docs/limpieza-historia-git.md` (runbook con backup, procedimiento y plan de reversión) |

### 11.3 Sincronización documental (H8/H9/H13)

| Hallazgo | Acción | Estado |
|---|---|---|
| H8 (versionado de la matriz) | Página de la Matriz actualizada a **v4.0 OFICIAL** + nota de unificación (2026-10-03) | Resuelto |
| H9 (nota obsoleta M17) | `docs/matriz_trazabilidad_completa.md` corregida (HU61–HU69 definitivas) | Resuelto |
| H13 (precisión en PT-ECU-01) | Comentario de revisión registrado en la página (5 roles de registro vs 6 actores) | Registrado para el próximo ciclo |

### 11.4 Pendientes

| Elemento | Responsable |
|---|---|
| 2 approvals + merge del PR #1 | Equipo Scrum |
| Limpiar el `GITHUB_TOKEN` global inválido para `gh` | Fabián (Scrum Master) |
| H10: normalización MoSCoW de las 69 HU (requiere validación del PO) | Product Owner + equipo |
| H11: subir los diagramas UML M13–M17 a Notion (fuentes listas en `docs/uml/`) | Equipo (sprint de modelado) |
| P2/T6: verificación por correo, perfiles empresa/transportista, migración del prototipo marketplace a la API propia | Equipo de desarrollo |

### 11.5 Incremento 2a, evidencia SENA y limpieza de historia (3 de octubre de 2026)

| Acción | Estado | Evidencia |
|---|---|---|
| A — Recuperación de contraseña completa | Completado | Migración `add_password_reset_tokens`; endpoints `/forgot-password` y `/reset-password`; **160/160 pruebas backend**; **6/6 E2E**; pantallas `ForgotPasswordScreen` y `ResetPasswordScreen` con token por URL; `FileEmailService` para desarrollo |
| Plan del T6 restante | Documentado | `docs/plan-t6-restante.md` (verificación de correo, perfiles empresa/transportista, marketplace API propia) |
| B/H11 — Diagramas UML de M13–M17 | Completados | 5 fuentes PlantUML + 5 SVG renderizados (sin errores de sintaxis) en `docs/uml/`, con README de integración a Notion |
| B/H10 — Normalización MoSCoW | Propuesta documentada | `docs/propuesta-normalizacion-moscow.md` (mapeo de 6 a 4 categorías; requiere validación del PO antes de aplicarse) |
| C — Limpieza de historia de git | Completada | `git filter-repo`: 36 commits reescritos, `.git` de 21 MB a 4 MB; force-push de `main` (`f2d12a1`) y `develop` (`5fa5a5a`); PR #1 recalculado; aviso de re-clonación publicado; backups mirror conservados |

### 11.6 Incremento 2b, MoSCoW ejecutado y verificación de UML (3 de octubre de 2026)

| Acción | Estado | Evidencia |
|---|---|---|
| Normalización MoSCoW (H10) | Completada | 48 HU actualizadas con `scripts/normalize_moscow.py`; conteo verificado contra Notion: **35 Must · 8 Should · 21 Could · 5 Won't**; log de auditoría por HU |
| Incremento 2b — Verificación de correo | Completado | Migración `20261003100000_add_email_verification`; endpoints `/verify-email` y `/resend-verification`; envío automático al registrar; campo `verificado` en el perfil público; pantalla `VerifyEmailScreen` con reenvío; **178/178 pruebas backend** (cobertura 97.18% lines) · **7/7 E2E** |
| Diagramas UML M13–M17 en Notion | Verificado | 5 SVG integrados en PT-ECU-01 (secciones 3.2.13–3.2.17), sin notas "pendiente" residuales |
| `gh` CLI | Diagnosticado | La cuenta `AgroConnect-superapp` está autenticada en el keyring con scopes correctos; el fallo lo produce la variable de entorno `GITHUB_TOKEN` inválida. Solución: `unset GITHUB_TOKEN` en la terminal |

### 11.7 Hallazgos de infraestructura (3 de octubre de 2026)

| Elemento | Estado | Detalle |
|---|---|---|
| Jira (SSOT operativo) | **Inaccesible** | `https://agroconnect.atlassian.net` responde **HTTP 404** y la API "Site temporarily unavailable". El sitio de Atlassian parece suspendido o eliminado (expiración por inactividad de sitios gratuitos). Requiere decisión del equipo: recrear el sitio y reconstruir el backlog desde Notion (69 HU con prioridades MoSCoW ya normalizadas, scripts `scripts/jira_client.py` disponibles) o emitir un ADR que reemplace Jira como SSOT operativo |
| Token `GITHUB_PERSONAL_ACCESS_TOKEN` (`.env`) | **Inválido** | El PAT almacenado fue revocado; el MCP de GitHub está caído. Actualizar con el token del keyring (`GITHUB_TOKEN= gh auth token`), `direnv reload` y reiniciar OpenCode |
| `gh` CLI | Operativo | Cuenta `AgroConnect-superapp` autenticada en keyring con scopes `repo`, `workflow`, `read:org` |
| PR #1 | Abierto y mergeable | CI en verde (último run `success`); pendiente como último paso del plan de auditoría (2 approvals + merge) |
| Ramas `feature/*` locales | Integradas | `feature/m02-auth`, `feature/m02-auth-increment-1` y `feature/m16-geolocation` están funcionalmente contenidas en `develop`; eliminables tras el merge del PR |
| README raíz y `frontend/README.md` | Desactualizados | README raíz menciona React 18/10 skills/146 pruebas (realidad: React 19, 11 skills, 178 pruebas); `frontend/README.md` sigue siendo el template de Vite. Higiene documental pendiente |

---

## Actualización 2026-10-04 — MCP de GitHub eliminado

Por decisión del propietario del proyecto, el **MCP de GitHub fue eliminado**
de `opencode.json` (sección `mcp.github` y los permisos `github_*`), junto con
la variable `GITHUB_PERSONAL_ACCESS_TOKEN`. Las operaciones de GitHub se hacen
con el **`gh` CLI** (sesión en el keyring), que cubre toda la API sin consumir
contexto del modelo ni depender de un PAT aparte.

Los hallazgos **H7** y la nota del token en la tabla anterior quedan **cerrados
por eliminación de la herramienta** (ya no aplica mantener un PAT para el MCP).
