# Esquema comercial objetivo — AgroConnect

**Estado:** implementado y validado en bases temporales locales el 27/11/2026 (24 tablas, 14 políticas RLS, 96 constraints, 63 índices, 6 triggers; 6 colecciones MongoDB). No es el esquema del MVP (`public` en Prisma); es el modelo comercial auditado.

## Contenido

| Archivo | Uso |
| --- | --- |
| `schema.sql` | 24 tablas PostgreSQL 16, enums, restricciones e índices |
| `security.sql` | roles mínimos, RLS y políticas por actor, GRANT |
| `integrity.sql` | H07–H09: pedido con ítems, stock atómico y liberación al cancelar |
| `mongo-init.js` | 6 colecciones MongoDB con validadores, índices, TTL y deduplicación |
| `verify.sql` | conteos y verificaciones de aceptación |

## Aplicación local

```bash
docker exec agroconnect-postgres createdb -U agroconnect agroconnect_commercial
docker exec -i agroconnect-postgres psql -U agroconnect -d agroconnect_commercial < database/commercial/schema.sql
docker exec -i agroconnect-postgres psql -U agroconnect -d agroconnect_commercial < database/commercial/security.sql
docker exec -i agroconnect-postgres psql -U agroconnect -d agroconnect_commercial < database/commercial/integrity.sql

docker run -d --name agroconnect-mongo -p 127.0.0.1:27018:27017 mongo:8.2
docker exec -i agroconnect-mongo mongosh --quiet < database/commercial/mongo-init.js
```

## Evidencia

- `docs/evidencias/sql/commercial-schema-2026-11-27.txt`
- `docs/evidencias/sql/commercial-integrity-2026-11-27.txt`
- `docs/evidencias/mongo/commercial-mongo-2026-11-27.txt`

## Límites

- El API NestJS sigue usando el esquema MVP de Prisma; la integración del esquema comercial con el API es una fase posterior.
- La sincronización offline (H12) y la migración con datos (H15) siguen pendientes.
- RLS se probó con `SET ROLE agroconnect_app` y `app.current_user_id`; falta la integración de sesión de aplicación.
