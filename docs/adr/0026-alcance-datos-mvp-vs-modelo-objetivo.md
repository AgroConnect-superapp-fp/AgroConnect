# ADR-026 — Alcance de datos: MVP implementado vs modelo comercial objetivo

- **Estado:** **Sustituida por ADR-029** (Ruta B, 26/11/2026)
- **Fecha:** 2026-11-26
- **Decisores:** Responsable del proyecto, arquitectura de datos, QA
- **Relacionado:** auditoría H01–H16, ADR-006 (UUID/LWW), ADR-008 (monolito modular), ADR-011 (políglota), ADR-022 (marketplace vitrina)

## Contexto

El informe `AgroConnect-Informe-de-brechas.pdf` audita el manual **PT-MCBD-01 v3.0** y su modelo comercial objetivo: 24 tablas, cinco colecciones MongoDB, RLS, pedidos, inventario, logística, sincronización offline y respaldos.

El repositorio implementa un MVP verificado con:

- 10 modelos Prisma;
- 12 migraciones;
- PostgreSQL 16.4 + PostGIS 3.4.3;
- autorización en la API (`SessionAuthGuard`, `RolesGuard`, casos de uso);
- 0 políticas RLS;
- 0 implementación MongoDB;
- 0 tablas de pedidos, stock o envíos;
- 0 tabla de auditoría inmutable;
- 456 pruebas API, 155 frontend y 18 E2E.

El riesgo principal es atribuir al MVP controles que solo existen en el diseño objetivo. La auditoría es documental y su aceptación técnica se refiere al modelo comercial, no al estado actual.

## Decisión

Se adopta la **opción A: exclusión formal y temporal del modelo comercial del alcance de aceptación del MVP**, manteniendo ese modelo como diseño objetivo versionado.

### 1. Capas de verdad

| Capa | Contenido | Regla |
| --- | --- | --- |
| Implementado | Identidad, perfiles, marketplace, parcelas, moderación, geoespacial, administración de usuarios | Se prueba y se declara como estado real |
| Diseño objetivo | 24 tablas, RLS, pedidos, stock, envíos, MongoDB, sync offline y SQLite/IndexedDB | Se documenta como objetivo; no se presenta como implementado |
| Backlog | M04, M05, M06, M07, M08, M09, M11, M12, M13, M14, M15, M17 | Se planifica; no cuenta como evidencia de aceptación |

### 2. Hallazgos excluidos del MVP

Se excluyen de la aceptación del MVP, con la obligación de mantenerlos en el diseño objetivo y en el roadmap:

- **H07** — reglas de pedido, detalle y unidad de despacho.
- **H08** — unicidad de `detalle_pedido`.
- **H09** — reserva atómica de stock.
- **H12** — sincronización LWW/versionado.
- **H13** — MongoDB, validadores y deduplicación.
- **H15, parte offline** — SQLite/IndexedDB y migración con cola local.

**H05 (RLS)** no se elimina: se trata como **control objetivo del modelo comercial**. El MVP mantiene autorización en la API y no afirma tener RLS. La equivalencia y las pruebas se documentan en ADR-027.

### 3. Hallazgos que permanecen en el cierre del MVP

- H01, H02, H03, H04: verdad documental y ambientes.
- H06: acceso, secretos y TLS del MVP.
- H10, H11: restricciones, índices y rendimiento del esquema actual.
- H14: auditoría inmutable de acciones administrativas.
- H16: RPO/RTO, respaldo y restauración.
- H15, parte de migraciones del esquema actual.

## Consecuencias

**Positivas**

- El manual deja de atribuir al MVP controles no implementados.
- El auditor puede evaluar el modelo comercial como diseño, no como producción.
- Se evita construir 24 tablas y MongoDB solo para “pasar” una auditoría documental.
- El equipo concentra el esfuerzo en los riesgos reales del MVP: auditoría, backups, restricciones y acceso.

**Negativas / trade-offs**

- El cierre de H07–H09, H12, H13 y H15-offline queda condicionado a la firma de exclusión del auditor/instructor.
- El modelo comercial sigue sin validación técnica y no puede presentarse como implementado.
- Si el requisito académico exige el modelo completo, se activa la opción B y este ADR se sustituye.

## Alternativas descartadas

| Alternativa | Motivo |
| --- | --- |
| Implementar las 24 tablas y MongoDB en el MVP | Cambia el alcance del producto, introduce módulos sin historias de usuario y retrasa el cierre real. |
| Editar el manual para ocultar la diferencia | Fraude documental; el auditor detectaría la falta de evidencia. |
| Declarar “no aplica” sin firma | No es una exclusión formal; deja el hallazgo abierto. |
| Implementar RLS solo en el papel | No protege datos y contradice la evidencia técnica. |

## Evidencia

- `AgroConnect-Informe-de-brechas.pdf` (16 hallazgos).
- `apps/api/prisma/schema.prisma` (10 modelos).
- `apps/api/prisma/migrations` (12 migraciones).
- `docs/evidencias/sql/inventario-2026-11-26-*.txt`.
- `docs/matriz-aceptacion-auditoria-datos.md`.
- `docs/acta-exclusion-alcance-auditoria-2026-11-26.md`.
