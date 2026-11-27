# MATRIZ DE AMBIENTES DE DATOS

## AgroConnect — H03

**Versión:** 1.0  
**Fecha:** 26/11/2026

---

## 1. Matriz

| Parámetro | Local | Test | Staging | Producción |
| --- | --- | --- | --- | --- |
| PostgreSQL | 16.4 | 16.4 | Por verificar | Por verificar |
| PostGIS | 3.4.3 | 3.4.3 | Por verificar | Por verificar |
| Codificación | UTF8 | UTF8 | Por verificar | Por verificar |
| Collation | en_US.utf8 | en_US.utf8 | Por verificar | Por verificar |
| Timezone | Etc/UTC | Etc/UTC | Por verificar | Por verificar |
| Migraciones | 12 | 12 | Por verificar | Por verificar |
| RLS | 0 | 0 | Por verificar | Por verificar |
| Backup | No aplica | No aplica | Pendiente | Pendiente |
| Salud actual | No aplica | No aplica | Por verificar | **/health 200; /ready 200; login OK (27/11)** |
| Evidencia | `inventario-2026-11-26-*` + instalación limpia | `prisma migrate status` | Bloqueado por `RENDER_API_KEY` | Bloqueado por `RENDER_API_KEY` |

**Regla:** ningún ambiente se considera equivalente hasta que la ficha tenga versión, extensión, collation, timezone, migraciones y evidencia de instalación limpia.

---

## 2. Instalación limpia (criterio H03)

```bash
docker run --rm -d --name agroconnect-env-check \
  -e POSTGRES_USER=agroconnect \
  -e POSTGRES_PASSWORD=agroconnect \
  -e POSTGRES_DB=agroconnect_env_check \
  -p 55432:5432 postgis/postgis:16-3.4

# Aplicar migraciones con la URL del ambiente de verificación
cd apps/api
DATABASE_URL="postgresql://agroconnect:agroconnect@127.0.0.1:55432/agroconnect_env_check" \
  npx prisma migrate deploy

psql "postgresql://agroconnect:agroconnect@127.0.0.1:55432/agroconnect_env_check" \
  -c "select version(); select extname, extversion from pg_extension; show timezone;"
```

**Resultado local:** 12 migraciones aplicadas manualmente, PostGIS 3.4.3, 13 tablas (10 app + 3 PostGIS) en `agroconnect_env_check`. Evidencia: `docs/evidencias/sql/instalacion-limpia-2026-11-26.txt`. Falta repetirlo con `prisma migrate deploy` y en staging.

---

## 3. Brechas

- Staging y producción no se verificaron por falta de `RENDER_API_KEY`. Producción respondió **503 en `/health/ready`** el 27/11/2026. Tras agregar SMTP y reconectar Supabase, `/health` y `/health/ready` responden 200. Login inválido devuelve 401; las tablas existen. `/api/v1/products` responde 404 porque `main` no contiene el código actual del marketplace. Evidencia: `docs/evidencias/render-health-2026-11-27-3.txt`.
- No se ha ejecutado la instalación limpia anterior.
- No se ha medido RPO/RTO real (ADR-028).
- La matriz debe actualizarse cuando cambie la infraestructura.
