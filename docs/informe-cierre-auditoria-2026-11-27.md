# INFORME DE CIERRE DE AUDITORÍA

## AgroConnect — Respuesta a los hallazgos H01–H16

### Cierre documental y de implementación target

**Versión:** 1.1  
**Fecha de corte:** 27 de noviembre de 2026  
**Documento auditado:** `AgroConnect-Informe-de-brechas.pdf`  
**Fuente auditada:** PT-MCBD-01 Manual de Configuración Base de Datos, v3.0  
**Estado:** cierre documental y target; certificación de producción pendiente  
**Elaborado por:** Equipo AgroConnect

---

## 0. Control documental

| Campo | Valor |
| --- | --- |
| Proyecto | AgroConnect |
| Programa | Análisis y Desarrollo de Software — SENA |
| Centro | Comercio y Turismo · Regional Quindío |
| Ficha | 3292136 |
| Ciudad | Armenia, Quindío |
| Rama de trabajo | `feature/audit-data-remediation` |
| Commit de referencia | `524175c` + commits posteriores de evidencia |
| Base local | PostgreSQL 16.4 + PostGIS 3.4.3 en Docker |
| Base target | `agroconnect_commercial` (24 tablas) |
| MongoDB target | `agroconnect_nosql` (6 colecciones) |
| Evidencia | Repositorio, Notion AUD-03 y evidencias SQL/Mongo |

---

## 1. Resumen ejecutivo

El presente informe responde a los **16 hallazgos** del informe de auditoría documental de bases de datos. La respuesta se organiza en tres niveles:

1. **Cierre documental:** corrección del manual PT-MCBD-01, MER, diccionario y matriz de aceptación.
2. **Cierre target:** implementación y prueba del modelo comercial en PostgreSQL y MongoDB, separado del esquema MVP de Prisma.
3. **Residual de producción:** actividades que dependen de staging, VPS, TLS o integración con el API NestJS.

La auditoría original contiene **3 hallazgos críticos** (H05, H09, H12), **11 altos** y **2 medios**. Al corte de este informe:

- **11 hallazgos** tienen corrección documental, target o local con evidencia.
- **5 hallazgos** conservan residuales de producción o integración: H06, H11, H12, H15 y H16.
- **Este es un informe de avance/cierre del ejercicio SENA; no requiere firma de auditor externo.**

### Estado de producción

- `/health` → **200**
- `/health/ready` → **200**
- Login con credenciales inválidas → **401**, lo que confirma que el schema de autenticación existe.
- `/api/v1/products` → **404**, porque Render despliega `main`, que no contiene el marketplace actual. No es un fallo de Supabase.

**Conclusión:** procede el **cierre documental y de implementación target**. No procede declarar conformidad total de producción hasta integrar el esquema target al API y desplegar la rama correcta.

---

## 2. Alcance y método

### 2.1 Alcance

El informe cubre:

- los 16 hallazgos del PDF de auditoría;
- el manual PT-MCBD-01 y sus anexos;
- el esquema comercial PostgreSQL;
- las colecciones MongoDB;
- la seguridad, integridad, sincronización y recuperación;
- las evidencias de Docker local;
- el estado de producción en Render.

### 2.2 Método

1. Contraste del PDF con el repositorio y Notion.
2. Corrección del manual y del modelo conceptual.
3. Implementación del esquema comercial en `database/commercial/`.
4. Pruebas SQL de RLS, stock, restricciones y sincronización.
5. Implementación y prueba de colecciones MongoDB.
6. Instalación limpia y backup/restore en Docker.
7. Verificación de producción en Render.

### 2.3 Regla de cierre

Un hallazgo se considera **atendido** cuando tiene acción, evidencia y residual identificado. No se exige certificación externa para este ejercicio; el informe deja constancia de acciones, evidencias y residuales.

---

## 3. Matriz de respuesta a hallazgos

| ID | Severidad | Estado de cierre | Respuesta aplicada | Evidencia | Residual |
| --- | --- | --- | --- | --- | --- |
| H01 | Alta | Cerrado documental | Matriz de aceptación con capas MVP, target y backlog | `docs/matriz-aceptacion-auditoria-datos.md` | — |
| H02 | Alta | Cerrado | R19 corregida a transportistas y R21 a publicaciones; rutas indirectas y FK documentadas | PT-MCBD-01 actualizado | — |
| H03 | Media | Cerrado local | Matriz de ambientes y instalación limpia con 13 migraciones | `docs/matriz-ambientes-datos.md`; `clean-install-docker` | Staging/producción |
| H04 | Alta | Cerrado | `latitud`/`longitud` y cuatro campos de consentimiento dentro del DDL | PT-MCBD-01 actualizado | — |
| H05 | Crítica | Cerrado target | 17 políticas RLS, funciones anti-recursión y RLS financiero | `database/commercial/security*.sql`; `commercial-rls-finance` | Integración con API |
| H06 | Alta | Parcial | RLS financiero probado: soporte no ve transacciones; comprador y admin sí | `docs/evidencias/sql/commercial-rls-finance-2026-11-27.txt` | TLS de staging |
| H07 | Alta | Cerrado target | Varios envíos por pedido y trigger de pedido con ítems | `database/commercial/integrity.sql` | Integración con API |
| H08 | Alta | Cerrado target | `UNIQUE (id_pedido, id_publicacion)` en `detalle_pedido` | `schema.sql`; prueba de duplicado | Integración con API |
| H09 | Crítica | Cerrado target | Reserva atómica de stock y liberación al cancelar; prueba 7+7 | `commercial-integrity` | Integración con API |
| H10 | Alta | Cerrado target | 96 constraints; catálogo y pruebas negativas | `commercial-verify`; `dataConstraints.e2e` | Integración con API |
| H11 | Media | Cerrado local | 64 índices; EXPLAIN de publicaciones, pedidos y lotes | `commercial-explain` | Volumen productivo |
| H12 | Crítica | Parcial target | Protocolo de publicación idempotente y versionado por servidor | `database/commercial/sync.sql`; `commercial-sync` | Sync Mongo/offline |
| H13 | Alta | Cerrado target | 6 colecciones, validadores, TTL y unique por conversación | `database/commercial/mongo-init.js`; evidencia Mongo | Integración con API |
| H14 | Alta | Cerrado | `audit_events` append-only, trigger y escritura transaccional | Migración `20261127050630`; E2E | Más eventos sensibles |
| H15 | Alta | Parcial | Instalación limpia con Prisma y 13 migraciones | `clean-install-docker` | Datos y offline |
| H16 | Alta | Parcial | Backup `pg_dump` + SHA-256 y restauración local | `backup-restore-docker` | Staging y RPO/RTO |

---

## 4. Evidencia técnica consolidada

### 4.1 Esquema comercial PostgreSQL

| Indicador | Resultado |
| --- | ---: |
| Tablas del modelo comercial | 24 |
| Tablas totales con `spatial_ref_sys` | 25 |
| Constraints | 96 |
| Índices | 64 |
| Políticas RLS | 17 |
| Triggers | 6 |

Pruebas ejecutadas:

- 7 + 7 sobre stock 10: una sola reserva; la segunda falla.
- Detalle duplicado: bloqueado.
- Dos envíos para el mismo pedido: permitidos.
- Cancelación: devuelve el stock a 10 una sola vez.
- RLS: productor ve su publicación; comprador no; soporte no ve transacciones; comprador y administrador sí.
- H11: lotes mejoró de **1,868 ms** a **0,162 ms** con índice compuesto.

### 4.2 MongoDB

Base `agroconnect_nosql`:

- `notificaciones`
- `conversaciones`
- `mensajes`
- `logs_actividad` (time-series)
- `estadisticas_agregadas`
- `eventos_sincronizacion`

Validadores, TTL y `UNIQUE (conversacion_id, uuid_local)` aplicados. Se probó duplicado en la misma conversación, mismo UUID en otra conversación y fecha inválida.

### 4.3 H14 — auditoría inmutable

- `audit_events` append-only.
- Trigger que bloquea `UPDATE`/`DELETE`.
- Escritura en la misma transacción del cambio de estado/rol.
- E2E de reconstrucción y protección.
- API: **462/462 pruebas**, 49 suites.

### 4.4 Docker local

- PostgreSQL 16.4 + PostGIS 3.4.3, `127.0.0.1:5434`.
- Instalación limpia con Prisma: 13 migraciones.
- Backup `pg_dump` y restauración en base aislada con checksum.

### 4.5 Producción

- SMTP corregido.
- Supabase conectado.
- `/health` y `/health/ready` en 200.
- Login inválido 401.
- `/api/v1/products` 404 por código de `main` desactualizado.

---

## 5. Residuales y plan de continuidad

### 5.1 Residuales

| Residual | Impacto | Acción |
| --- | --- | --- |
| H06 TLS de staging | No se ha demostrado `sslmode=require` en staging | Configurar TLS y prueba negativa |
| H11 volumen productivo | EXPLAIN local con 5.000 registros | Repetir con volumen real y metas |
| H12 sync Mongo/offline | Solo protocolo PostgreSQL de publicación | Implementar cola offline y reconciliación Mongo |
| H15 datos/offline | Instalación limpia, sin migración con datos ni SQLite/IndexedDB | Ensayo con datos y app móvil |
| H16 staging/RPO/RTO | Backup local, sin staging ni acta | Simulacro en staging y firmar RPO/RTO |
| Integración API/Prisma | Esquema target separado del API | Adaptadores, contratos y migración |
| `main` desactualizado | Productos 404 en producción | Fusionar PRs o desplegar rama correcta |

### 5.2 Plan inmediato

1. Desplegar el código actual (PR #110 y #111) o cambiar temporalmente la rama de Render.
2. Verificar `/api/v1/products` y login real.
3. Integrar el esquema commercial al API.
4. Completar H12 con sync Mongo/offline.
5. Ejecutar H15 con datos y H16 en staging.
6. Revisión final del equipo y del instructor.

---

## 6. Concepto de cierre

### 6.1 Cierre documental

**Procede.** El manual, la matriz, el MER, el diccionario y las evidencias responden a los 16 hallazgos. Las correcciones están registradas en Notion y en el repositorio.

### 6.2 Cierre target

**Procede con salvedades.** El esquema comercial y MongoDB están implementados y probados en local. No están integrados al API NestJS ni desplegados en producción.

### 6.3 Cierre de producción

**No procede todavía.** Producción tiene salud y base de datos, pero el código desplegado en `main` no contiene el marketplace actual. Además, H06, H11, H12, H15 y H16 conservan residuales.

### 6.4 Declaración

El proyecto declara **atendidos documentalmente y en target** los 16 hallazgos, con residuales explícitos. No declara conformidad total de producción.

---

## 7. Equipo del proyecto y aprobaciones

### 7.1 Integrantes

| Integrante | Rol |
| --- | --- |
| Nelson Fabián Gallego Sánchez | Scrum Master / Arquitectura |
| Juan David Ferrer Castillo | Product Owner |
| Santiago Palacio Tovar | Desarrollador |

### 7.2 Aprobaciones

| Rol | Nombre | Firma | Fecha |
| --- | --- | --- | --- |
| Elaboró — Arquitectura / Datos | Nelson Fabián Gallego Sánchez |  |  |
| Revisó — Product Owner | Juan David Ferrer Castillo |  |  |
| Revisó — Desarrollo | Santiago Palacio Tovar |  |  |
| Aprobó — Instructor SENA |  |  |  |

---

## Anexo A. Evidencias

| Evidencia | Ubicación |
| --- | --- |
| Matriz H01–H16 | `docs/matriz-aceptacion-auditoria-datos.md` |
| Inventario target | `docs/inventario-esquema-comercial-2026-11-27.md` |
| Inventario MVP | `docs/inventario-esquema-bd-2026-11-26.md` |
| Instalación limpia | `docs/evidencias/sql/clean-install-docker-2026-11-27.txt` |
| Backup/restore | `docs/evidencias/sql/backup-restore-docker-2026-11-27.txt` |
| RLS financiero | `docs/evidencias/sql/commercial-rls-finance-2026-11-27.txt` |
| Integridad comercial | `docs/evidencias/sql/commercial-integrity-2026-11-27.txt` |
| EXPLAIN | `docs/evidencias/sql/commercial-explain-2026-11-27.txt` |
| Sync | `docs/evidencias/sql/commercial-sync-2026-11-27.txt` |
| MongoDB | `docs/evidencias/mongo/commercial-mongo-2026-11-27.txt` |
| Producción | `docs/evidencias/render-health-2026-11-27-3.txt` |
| Plan Supabase → Docker | `docs/plan-migracion-supabase-docker-2026-11-27.md` |

## Anexo B. Comandos de reproducción

```bash
# Docker local
docker compose up -d
./scripts/db-clean-install.sh
./scripts/db-backup.sh
./scripts/db-restore.sh backups/agroconnect-....dump

# Esquema comercial
docker exec -i agroconnect-postgres psql -U agroconnect -d agroconnect_commercial < database/commercial/schema.sql
docker exec -i agroconnect-postgres psql -U agroconnect -d agroconnect_commercial < database/commercial/security.sql
docker exec -i agroconnect-postgres psql -U agroconnect -d agroconnect_commercial < database/commercial/security-rls-fix.sql
docker exec -i agroconnect-postgres psql -U agroconnect -d agroconnect_commercial < database/commercial/integrity.sql
docker exec -i agroconnect-postgres psql -U agroconnect -d agroconnect_commercial < database/commercial/sync.sql

# MongoDB
docker exec -i agroconnect-mongo mongosh --quiet < database/commercial/mongo-init.js

# Gates
npm run lint
npm run typecheck
npm test --workspace @agroconnect/api -- --runInBand
```

## Anexo C. Glosario

| Término | Definición |
| --- | --- |
| RLS | Row Level Security de PostgreSQL |
| LWW | Last-Write-Wins con control de versión |
| RPO/RTO | Pérdida y tiempo de recuperación objetivo |
| Target | Modelo comercial implementado en `database/commercial` |
| Cerrado documental | Hallazgo atendido en manual y matriz |
| Residual | Actividad que depende de staging, producción o integración |

---

**Fin del informe.**  
Versión 1.1 — 27/11/2026. Cierre documental y target con residuales de producción declarados.
