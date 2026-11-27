# MATRIZ DE ACEPTACIÓN — AUDITORÍA DE DATOS

## AgroConnect · hallazgos H01–H16

**Versión:** 1.0  
**Fecha:** 26/11/2026  
**Decisión de alcance:** **Ruta B** — implementación del modelo comercial completo (`ADR-029`). Sin exclusiones vigentes.  
**Regla:** ningún hallazgo se marca cerrado hasta que el auditor valide la evidencia.

---

## 1. Capas de aceptación

| Capa | Definición | Evidencia |
| --- | --- | --- |
| MVP implementado | Lo que existe, se ejecuta y tiene pruebas en el repositorio | Commits, tests, migraciones, E2E |
| Diseño objetivo | Modelo comercial 24 tablas, RLS, pedidos, stock, MongoDB y offline | Manual PT-MCBD-01 v3.1, ADRs |
| Backlog | Módulos aún no construidos | Roadmap y historias de usuario |

El MVP no hereda la aceptación del diseño objetivo. El diseño objetivo no se declara implementado por aparecer en el manual.

---

## 2. Matriz H01–H16

| ID | Severidad | Ruta de cierre | Estado al 26/11 | Evidencia/acción |
| --- | --- | --- | --- | --- |
| H01 | Alta | Documental | **En cierre** | Esta matriz + anexo PT-MCBD-01 v3.1 |
| H02 | Alta | Documental | **En cierre** | Corrección R19/R21 en anexo Notion |
| H03 | Media | Documental/técnica | **Parcial** | `docs/matriz-ambientes-datos.md`; instalación limpia local OK; staging/producción pendientes |
| H04 | Alta | Documental | **En cierre** | Diccionario conceptual/físico en anexo Notion |
| H05 | Crítica | Implementación RLS | **Implementado target** | 17 políticas RLS + funciones anti-recursión + GRANT |
| H06 | Alta | Técnica MVP | **Parcial** | RLS financiero y denegación a soporte probados; TLS de staging pendiente |
| H07 | Alta | Implementación Ruta B | **Implementado target** | 24 tablas; varios envíos; trigger de ítems |
| H08 | Alta | Implementación Ruta B | **Implementado target** | `UNIQUE (id_pedido,id_publicacion)` |
| H09 | Crítica | Implementación Ruta B | **Implementado target** | Reserva atómica + liberación; prueba 7+7 y cancelación |
| H10 | Alta | Técnica MVP | **Implementado target** | 96 constraints en esquema comercial + pruebas |
| H11 | Media | Técnica MVP | **Implementado target** | 64 índices; EXPLAIN de 3 consultas; pendiente volumen productivo |
| H12 | Crítica | Implementación Ruta B | **Abierto** | Pendiente contrato/pruebas de sync |
| H13 | Alta | Implementación Ruta B | **Implementado target** | 6 colecciones, validadores, TTL y unique por conversación; probado |
| H14 | Alta | Técnica MVP | **Implementado técnico** | `audit_events` append-only + E2E; falta firma del auditor |
| H15 | Alta | Implementación Ruta B | **Abierto** | Instalación limpia local OK; falta migración con datos y offline |
| H16 | Alta | Técnica MVP | **Parcial** | ADR-028; restauración local OK; falta RPO/RTO de producción |

**Resumen:** Ruta B activa; **0 hallazgos cerrados por auditor**. H05, H07, H08, H09, H10 y H13 tienen implementación target validada. H12, H15 y H16 siguen pendientes; H06/H11 requieren staging/EXPLAIN.

---

## 3. Decisiones aprobadas

| ID | Decisión | Estado |
| --- | --- | --- |
| D-01 | Mantener el modelo comercial como diseño objetivo y excluirlo del MVP | Aprobada por el responsable; pendiente auditor/instructor |
| D-02 | API autoritativa en MVP; RLS obligatorio en modelo comercial | Aprobada en ADR-027 |
| D-03 | MongoDB fuera del MVP; se reevalúa si el requisito académico lo exige | Aprobada en ADR-026 |
| D-04 | Varios envíos por pedido; `envios.id_pedido` sin UNIQUE | Implementada en esquema target |
| D-05 | Sync versionado diferido al diseño de M14 | Diferida con H12 |
| D-06 | RPO 24 h / RTO 4 h propuestos | Aceptada provisionalmente; falta simulacro |

---

## 4. Evidencia base del MVP

| Elemento | Resultado | Archivo |
| --- | --- | --- |
| Modelos Prisma | 10 | `apps/api/prisma/schema.prisma` |
| Migraciones | 13 | `apps/api/prisma/migrations` |
| Tablas de aplicación | 11 | `docs/evidencias/sql/inventario-2026-11-26-tablas.txt` |
| Restricciones | 28 (13 PK, 9 FK, 6 CHECK) | `docs/evidencias/sql/inventario-2026-11-26-restricciones.txt` |
| Índices | 44 | `docs/evidencias/sql/inventario-2026-11-26-indices.txt` |
| Políticas RLS | 0 | `docs/evidencias/sql/inventario-2026-11-26-rls.txt` |
| MongoDB | 0 colecciones | No existe dependencia |
| Auditoría inmutable | 0 tablas | Solo Pino |
| Pruebas | 462 API · 155 frontend · 18 E2E | Cierre 26/11/2026 |
| Instalación limpia | 13 tablas, PostGIS 3.4.3, 26 constraints, 39 índices | `docs/evidencias/sql/instalacion-limpia-2026-11-26.txt` |
| Restauración | 14 tablas, 27 constraints, 40 índices, 0 RLS | `docs/evidencias/sql/restauracion-2026-11-26.txt` |

---

## 5. Protocolo de cierre

Para cada hallazgo se exige:

1. Corrección en la fuente de verdad.
2. Prueba ejecutada en un ambiente identificado.
3. Evidencia enlazada (commit, log, SQL, captura).
4. Revisión de QA/arquitectura.
5. Firma del auditor o exclusión formal aprobada.

**Prohibido:** cerrar un hallazgo porque “el documento ya lo dice”, porque el equipo lo considera obvio o porque el módulo pertenece al backlog sin acta de exclusión.

---

## 6. Bloqueos actuales

| Bloqueo | Impacto | Acción |
| --- | --- | --- |
| Notion PT-MCBD-01 no está compartido con la integración (404) | No se puede editar la fuente oficial desde el agente | El usuario debe compartir la página o pegar el anexo v3.1 |
| Firma del auditor/instructor | Las exclusiones son provisionales | Formalizar acta |
| `RENDER_API_KEY` | No se puede validar staging/producción ni backups reales | Provisión de credenciales |
| Integración API/sync pendiente | El esquema target existe, pero el API NestJS sigue usando Prisma MVP | Implementar adaptadores y contratos en la siguiente fase |
