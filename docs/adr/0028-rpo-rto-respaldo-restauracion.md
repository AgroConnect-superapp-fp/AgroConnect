# ADR-028 — RPO, RTO y restauración de datos

- **Estado:** Aceptada provisionalmente; pendiente de simulacro y validación de infraestructura
- **Fecha:** 2026-11-26
- **Decisores:** DevOps, arquitectura, PO
- **Relacionado:** auditoría H16, ADR-026, `docs/runbook-despliegue-postgres.md`

## Contexto

La auditoría H16 exige RPO/RTO aprobados y una restauración coordinada. Existen runbooks de despliegue y recuperación, pero la restauración no se ha ensayado con datos reales en esta iteración.

## Decisión

Para el MVP se adoptan provisionalmente:

- **RPO:** 24 horas.
- **RTO:** 4 horas.
- **Retención:** 30 días de backups diarios.
- **Restauración:** ensayo trimestral en ambiente aislado, con verificación de filas, referencias y eventos.
- **Motores:** PostgreSQL/PostGIS; MongoDB solo si se activa el modelo comercial.

El RPO/RTO definitivo se revisa con el proveedor de infraestructura y el PO antes de usar datos reales.

## Consecuencias

- H16 no se cierra hasta que exista un acta de simulacro con tiempos y checksums.
- Si el proveedor no garantiza el RTO, se documenta la limitación y se ajusta el objetivo.
- La restauración de MongoDB se prueba por separado cuando exista.

## Evidencia

- `docs/runbook-despliegue-postgres.md` §8.
- `docs/runbook-recuperacion-supabase.md`.
- Acta de simulacro pendiente.
