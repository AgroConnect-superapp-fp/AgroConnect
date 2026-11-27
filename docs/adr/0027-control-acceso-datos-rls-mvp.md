# ADR-027 — Control de acceso a datos: API autoritativa y RLS objetivo

- **Estado:** Aceptada; RLS obligatorio en la Ruta B (ADR-029)
- **Fecha:** 2026-11-26
- **Decisores:** Arquitectura, backend, seguridad
- **Relacionado:** ADR-026, auditoría H05/H06, ADR-010 (sesión)

## Contexto

La auditoría H05 exige que cada acceso de la matriz de permisos tenga política RLS o un control equivalente identificado. El MVP no tiene RLS: la autorización vive en la API y en los casos de uso. El modelo comercial objetivo sí requiere RLS por actor y por fila.

## Decisión

1. **MVP:** la API es la autoridad de acceso. `SessionAuthGuard` valida la sesión; `RolesGuard` y los casos de uso aplican RBAC y autorización por propiedad. No se afirma que exista RLS.
2. **Modelo comercial:** RLS es obligatorio antes de aceptar tablas sensibles (pedidos, stock, lotes, pagos, cobertura). Cada política se prueba con identidades reales y casos negativos.
3. **Rol de base de datos:** la aplicación usa un rol sin superusuario, sin DDL y con permisos mínimos. Las migraciones usan un rol separado.
4. **TLS:** las conexiones a staging/producción deben exigir TLS; la evidencia se registra en la matriz de ambientes.

## Consecuencias

- H05 se implementa en la Ruta B: RLS en el modelo comercial y pruebas de acceso en el MVP; no se marca cerrado hasta que el auditor valide la evidencia.
- H06 se puede cerrar con pruebas de roles, TLS y mínimo privilegio en el MVP.
- El día que se implementen pedidos/stock, la migración debe incluir RLS y pruebas de fila antes de exponer el módulo.

## Evidencia

- `SessionAuthGuard`, `RolesGuard`, pruebas de autorización.
- `docs/seguridad.md`.
- `docs/matriz-aceptacion-auditoria-datos.md`.
- `docs/matriz-ambientes-datos.md`.
