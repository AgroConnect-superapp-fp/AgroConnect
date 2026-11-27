# ACTA DE EXCLUSIÓN DE ALCANCE — AUDITORÍA DE DATOS

> **NO APLICA — SUSTITUIDA POR LA RUTA B (ADR-029).** La exclusión queda sin efecto y **sin firmas**. Se conserva solo como registro histórico de la decisión inicial.

## AgroConnect · decisión opción A

**Fecha:** 26/11/2026  
**Decisión:** excluir provisionalmente del alcance de aceptación del MVP los hallazgos del modelo comercial no implementado  
**Estado:** aprobada por el responsable del proyecto; pendiente de firma del auditor y del instructor

---

## 1. Contexto

El informe `AgroConnect-Informe-de-brechas.pdf` evalúa el manual PT-MCBD-01 v3.0 y su modelo comercial objetivo. El MVP implementado contiene 10 modelos Prisma y no contiene pedidos, stock, envíos, MongoDB, RLS ni sincronización offline.

El responsable del proyecto autorizó la **opción A** del plan de remediación: mantener el modelo comercial como diseño objetivo y excluirlo formalmente del alcance de aceptación del MVP, sin presentarlo como implementado.

## 2. Hallazgos excluidos

| Hallazgo | Motivo | Condición |
| --- | --- | --- |
| H07 | No existe módulo de pedidos/envíos | Mantener en diseño objetivo y roadmap |
| H08 | No existe `detalle_pedido` | Mantener en diseño objetivo |
| H09 | No existe inventario/stock | Mantener en diseño objetivo |
| H12 | No existe sincronización offline | Mantener en ADR-006/M14 |
| H13 | No existe MongoDB | Reevaluar si el requisito académico lo exige |
| H15 (offline) | No existe SQLite/IndexedDB | Mantener en M14 |

**H05** no se excluye: se reconoce que el MVP no tiene RLS y que la autorización actual es de API. RLS queda como requisito del modelo comercial (ADR-027).

## 3. Hallazgos que permanecen en el MVP

H01, H02, H03, H04, H06, H10, H11, H14, H15 (migraciones actuales) y H16.

## 4. Condiciones de la exclusión

1. El manual PT-MCBD-01 debe mostrar la separación implementado/objetivo/backlog.
2. La exclusión no declara “cerrado” el hallazgo; lo marca como fuera del alcance del MVP.
3. El auditor debe aprobar la exclusión o exigir la implementación.
4. Si el requisito académico exige el modelo completo, se activa la opción B.
5. La exclusión se revisa en la reauditoría.

## 5. Evidencia

- `docs/adr/0026-alcance-datos-mvp-vs-modelo-objetivo.md`
- `docs/adr/0027-control-acceso-datos-rls-mvp.md`
- `docs/matriz-aceptacion-auditoria-datos.md`
- `docs/inventario-esquema-bd-2026-11-26.md`
- `docs/evidencias/sql/inventario-2026-11-26-*.txt`
- `docs/evidencias/sql/instalacion-limpia-2026-11-26.txt`
- `docs/evidencias/sql/restauracion-2026-11-26.txt`
- `AgroConnect-Informe-de-brechas.pdf`

## 6. Firmas

| Rol | Nombre | Firma | Fecha |
| --- | --- | --- | --- |
| Responsable del proyecto |  |  |  |
| Instructor SENA |  |  |  |
| Auditor |  |  |  |
| QA |  |  |  |

---

**Nota:** sin las firmas, esta acta es una decisión interna provisional y no un cierre de auditoría.
