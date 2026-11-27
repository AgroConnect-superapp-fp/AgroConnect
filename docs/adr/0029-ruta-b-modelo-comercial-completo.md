# ADR-029 — Ruta B: implementación del modelo comercial completo

- **Estado:** Aceptada por el responsable del proyecto (26/11/2026)
- **Fecha:** 2026-11-26
- **Decisores:** Responsable del proyecto, arquitectura, datos, backend, QA
- **Relacionado:** ADR-006, ADR-008, ADR-011, ADR-022, ADR-026 (sustituida), ADR-027, ADR-028

## Contexto

La auditoría H01–H16 evalúa el modelo comercial objetivo de AgroConnect: 24 tablas, MongoDB, RLS, pedidos, stock, logística, sincronización offline y recuperación. La opción A (exclusión) fue aprobada inicialmente, pero el responsable del proyecto autorizó la **opción B**: implementar el modelo completo y no dejar hallazgos fuera del alcance.

La página oficial PT-MCBD-01 no está compartida con la integración de Notion (404). La respuesta se publica en `AUD-03 — Respuesta a la auditoría de datos AgroConnect` bajo la página raíz.

## Decisión

Se implementa la **Ruta B**:

1. **Sin exclusiones:** H07, H08, H09, H12, H13 y H15-offline pasan de “excluidos” a “abiertos en implementación”.
2. **Código primero:** cada hallazgo se cierra con migración, código, prueba y evidencia.
3. **Notion como espejo:** la matriz y el anexo se actualizan en AUD-03; PT-MCBD-01 se corrige cuando esté compartido.
4. **GitHub:** cada incremento entra por rama y PR, con CI verde.
5. **Sin afirmar cierre** hasta que el auditor firme.

## Alcance de implementación

| Workstream | Hallazgos | Entregable |
| --- | --- | --- |
| Seguridad y acceso | H05, H06, H14 | RLS, pruebas por rol, `audit_events` |
| Integridad comercial | H07–H11 | pedidos, detalle, envíos, stock, constraints, índices |
| Sincronización y documentos | H12, H13 | versionado/LWW, MongoDB validado |
| Migración y recuperación | H15, H16 | migración con datos, restore/RPO/RTO |
| Documentación | H01–H04 | PT-MCBD-01 v3.1, MER, diccionario, ambientes |

## Consecuencias

**Positivas**

- Se elimina la deuda de “diseño objetivo no implementado”.
- El informe de auditoría puede aspirar a 16/16 con evidencia real.
- Notion y GitHub quedan alineados.

**Negativas / trade-offs**

- Es un programa de varias iteraciones; no se completa en un solo PR.
- Aumenta el alcance del producto y el tiempo de entrega.
- Requiere migraciones nuevas, pruebas de concurrencia y un ambiente MongoDB.
- La página PT-MCBD-01 sigue bloqueada hasta que el usuario la comparta.

## Fases

| Fase | Contenido | Estado |
| --- | --- | --- |
| 0 | Notion AUD-03, ADR-029, matriz sin exclusiones | En curso |
| 1 | H14 `audit_events` + pruebas | Siguiente |
| 2 | H05 RLS + H06 pruebas de acceso | Pendiente |
| 3 | H07–H09 pedidos/stock | Pendiente |
| 4 | H12–H13 sync/Mongo | Pendiente |
| 5 | H15–H16 migración/restore | Pendiente |
| 6 | Reauditoría | Pendiente |

## Evidencia

- `AUD-03` en Notion (raíz AgroConnect).
- `docs/matriz-aceptacion-auditoria-datos.md`.
- `docs/plan-remediacion-auditoria-brechas-2026-11-26.md`.
- Repositorio GitHub: rama y PR por fase.
