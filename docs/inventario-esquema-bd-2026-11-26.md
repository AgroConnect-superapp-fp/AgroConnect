# INVENTARIO DEL ESQUEMA DE BASE DE DATOS

## AgroConnect — evidencia al 26/11/2026

**Fuente:** PostgreSQL local `agroconnect_dev` (contenedor `agroconnect-postgres`)  
**Consulta:** `information_schema`, `pg_constraint`, `pg_indexes`, `pg_policies`, `pg_extension`, `_prisma_migrations`  
**Evidencia cruda:** `docs/evidencias/sql/inventario-2026-11-26-*.txt`

---

## 1. Ambiente

| Parámetro | Valor |
| --- | --- |
| PostgreSQL | 16.4 |
| PostGIS | 3.4.3 |
| Codificación | UTF8 |
| Collation / Ctype | `en_US.utf8` |
| Timezone | `Etc/UTC` |
| Base | `agroconnect_dev` |
| Esquema | `public` |

Extensiones: `plpgsql`, `postgis`, `postgis_tiger_geocoder`, `postgis_topology`, `fuzzystrmatch`.

---

## 2. Tablas

**Aplicación (11):** `roles`, `users`, `producer_profiles`, `company_profiles`, `transporter_profiles`, `refresh_tokens`, `products`, `plots`, `password_reset_tokens`, `email_verification_tokens`, `audit_events`.

**Sistema (4):** `_prisma_migrations`, `geography_columns`, `geometry_columns`, `spatial_ref_sys`.

**No existen:** pedidos, detalle de pedido, envíos, inventario, movimientos de stock, lotes perecederos, auditoría, notificaciones, tickets, mensajes.

---

## 3. Restricciones

| Tipo | Cantidad |
| --- | ---: |
| PRIMARY KEY | 13 |
| FOREIGN KEY | 9 |
| CHECK | 6 |
| UNIQUE | 0 constraints (los UNIQUE de Prisma se materializan como índices únicos) |
| **Total** | **28** |

Las restricciones verificadas incluyen unicidad de correo, documento, celular, NIT, placa, token hash, relaciones con `ON DELETE CASCADE` y la PK de `audit_events`.

---

## 4. Índices

**44 índices** en `public`, entre ellos:

- PK de las 12 tablas.
- Índices únicos de correo, documento, celular, NIT, placa y tokens.
- Índices de búsqueda: `products(crop)`, `products(department, municipality)`, `products(created_at)`, `products(producer_id)`, `products(moderation_status)`.
- Índices de parcelas: `plots(farmer_id)`, `plots(deleted_at)`.
- Índices de refresh tokens: `user_id`, `family_id`, `(user_id, revoked)`.

No hay evidencia de `EXPLAIN` para volumen comercial. H11 sigue parcial.

---

## 5. RLS

- Políticas RLS: **0**.
- Tablas con `ENABLE ROW LEVEL SECURITY`: **0**.
- Roles: la API usa un rol de aplicación; no se encontró RLS en migraciones.

**Lectura:** el MVP no tiene RLS. No debe afirmarse lo contrario en PT-MCBD-01. La autorización actual es de API. RLS pertenece al modelo comercial (ADR-027).

---

## 6. Migraciones

**13 migraciones aplicadas** en `_prisma_migrations`, desde `20260928041427_init_auth` hasta `20261127050630_add_audit_events`.

La base de test también está migrada. No se ha ejecutado en esta iteración un ensayo de actualización con datos existentes (H15 parcial).

---

## 7. Conclusión

El esquema actual es consistente con un MVP de identidad, perfiles, marketplace y geoespacial. **No soporta** las afirmaciones del modelo comercial de 24 tablas ni las pruebas de pedidos, stock, MongoDB o RLS. La matriz de aceptación debe mantener esa distinción.


---

## 8. Instalación limpia y restauración

### Instalación limpia (base temporal)

Se aplicaron manualmente los 12 archivos `migration.sql` en `agroconnect_env_check`. Resultado:

- 13 tablas (10 de aplicación + 3 de PostGIS; sin `_prisma_migrations` porque el SQL se aplicó con `psql`).
- PostGIS 3.4.3.
- 26 restricciones y 39 índices (la diferencia con desarrollo es la PK de `_prisma_migrations`).
- 0 políticas RLS.

Evidencia: `docs/evidencias/sql/instalacion-limpia-2026-11-26.txt`.

### Restauración

Se generó un `pg_dump` de `agroconnect_dev` y se restauró en `agroconnect_restore_check`. Resultado:

- 14 tablas.
- 27 restricciones.
- 40 índices.
- 0 políticas RLS.
- Backup de 41 KB.

Evidencia: `docs/evidencias/sql/restauracion-2026-11-26.txt`.

**Límite:** la restauración se hizo en local, sin datos reales ni ventana RPO/RTO de producción. H16 sigue parcial hasta el simulacro en staging.
