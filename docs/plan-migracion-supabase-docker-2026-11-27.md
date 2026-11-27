# PLAN DE MIGRACIÓN — DE SUPABASE A POSTGRESQL EN DOCKER

## AgroConnect

**Versión:** 1.0  
**Fecha:** 27/11/2026  
**Objetivo:** retirar Supabase y operar PostgreSQL 16 + PostGIS 3.4 con Docker, sin romper la API, el frontend ni la auditoría.

---

## 1. Decisión que debe tomarse primero

Docker es una tecnología de empaquetado, no un lugar de hosting. Hay tres formas válidas de usarlo:

| Opción | Dónde corre | Persistencia | Costo/operación | Recomendación |
| --- | --- | --- | --- | --- |
| **A. Docker local** | Tu equipo | Volumen local | Cero costo; no es producción | Obligatorio para desarrollo y pruebas |
| **B. Docker en VPS** | Servidor con IP pública | Volumen del VPS | Bajo costo; tú operas backups, TLS y actualizaciones | **Recomendada si quieres dejar Supabase** |
| **C. Docker en Render** | Render Private Service | Disco persistente de Render | Plan pago; free no garantiza persistencia | Solo si aceptas costo y límites |
| **D. Postgres gestionado** | Render/Neon/etc. | Gestionada | Cero operación de DB | Alternativa si no quieres administrar un VPS |

**No se debe usar el `docker-compose.yml` local como producción.** El contenedor local escucha en `127.0.0.1:5434`, no tiene TLS público, backups automáticos ni alta disponibilidad.

**Recomendación para el proyecto:** Docker local para desarrollo/test + **Docker en un VPS** para producción, con volumen persistente y backups externos. Si el equipo no puede operar un VPS, usar Postgres gestionado y dejar Docker solo para local/test.

---

## 2. Estado actual

| Elemento | Estado |
| --- | --- |
| Docker local | `postgis/postgis:16-3.4`, puerto `127.0.0.1:5434`, volumen `agroconnect_pgdata` |
| Base local | `agroconnect_dev`; API local usa ese contenedor |
| Producción | Render `agroconnect-api` con `DATABASE_URL` de Supabase |
| Schema de producción | `agroconnect` (`DATABASE_SCHEMA=agroconnect`) |
| Migraciones | 12 migraciones Prisma aplicadas en local/test |
| Auditoría | Esquema comercial separado en `database/commercial/`; no es el esquema de producción |
| SMTP | Configurado en Render; el arranque ya no falla por correo |
| Listo | `/health` responde 200; `/health/ready` falla con `database:"down"` |

---

## 3. Arquitectura objetivo

### 3.1 Desarrollo y pruebas

```text
Desarrollador
  └─ docker compose up -d
       └─ postgis/postgis:16-3.4
            ├─ volumen agroconnect_pgdata
            ├─ puerto 127.0.0.1:5434
            └─ base agroconnect_dev / agroconnect_test
```

### 3.2 Producción con VPS

```text
Vercel (frontend)
      │ HTTPS
      ▼
Render (API NestJS)
      │ TLS PostgreSQL (sslmode=require)
      ▼
VPS con Docker
  ├─ contenedor postgis:16-3.4
  ├─ volumen /srv/agroconnect/pgdata
  ├─ proxy TLS (HAProxy/Caddy) o certificado del servidor
  ├─ firewall: solo Render egress IPs + administración
  ├─ pg_dump diario + copia externa
  └─ monitoreo y alertas
```

**Alternativa sin VPS:** Render Postgres o Neon. La API no cambia; solo cambia `DATABASE_URL`.

---

## 4. Fases del plan

### Fase 0 — Inventario y congelamiento (0,5 día)

| Tarea | Evidencia |
| --- | --- |
| Identificar schema real de Supabase (`agroconnect` o `public`) | `\dn`, `information_schema` |
| Medir tamaño de base, tablas e índices | `pg_database_size`, `pg_total_relation_size` |
| Listar roles, extensiones y dependencias | `pg_roles`, `pg_extension` |
| Identificar si hay RLS, triggers o funciones | `pg_policies`, `pg_trigger`, `pg_proc` |
| Verificar que la API no use Auth/Storage/Realtime de Supabase | grep de `VITE_SUPABASE`, `supabase` |
| Congelar escrituras durante la copia final | ventana de mantenimiento |

**Criterio de salida:** inventario firmado y ventana de corte aprobada.

---

### Fase 1 — Docker local reproducible (1 día)

El `docker-compose.yml` actual ya sirve para desarrollo. Completar:

```yaml
services:
  db:
    image: postgis/postgis:16-3.4
    container_name: agroconnect-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "127.0.0.1:5434:5432"
    volumes:
      - agroconnect_pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10
    shm_size: 256mb
```

Tareas:

1. Mover credenciales locales a `.env.local` (ignorado por Git).
2. Documentar `docker compose up -d`, `down`, `logs` y `psql`.
3. Crear `agroconnect_test` con las mismas migraciones.
4. Verificar que `npm run test:coverage` use test DB, no producción.
5. No exponer el puerto a `0.0.0.0`.

**Criterio de salida:** un clon limpio del repo levanta la DB y corre migraciones + tests.

---

### Fase 2 — Preparar PostgreSQL de producción (1–2 días)

#### 2.1 VPS

- Ubuntu 24.04 LTS o similar.
- Docker Engine + Compose plugin.
- Usuario no root para operar contenedores.
- Volumen en disco persistente: `/srv/agroconnect/pgdata`.
- Firewall:
  - `22/tcp` solo IP administrativa.
  - `5432/tcp` solo Render egress IPs o red privada.
  - No abrir `5432` a `0.0.0.0/0`.
- DNS: `db.<dominio>` si se usará TLS.

#### 2.2 Contenedor

- `postgis/postgis:16-3.4`.
- `POSTGRES_PASSWORD` aleatorio, fuera de Git.
- `shared_buffers`, `max_connections` y `work_mem` según RAM del VPS.
- `pg_hba.conf`: `hostssl` para la API; `scram-sha-256`.
- TLS: certificado del dominio o proxy TLS; la API usa `sslmode=require`.
- Backup: `pg_dump` diario + retención 30 días + copia externa.

#### 2.3 Roles

```sql
CREATE ROLE agroconnect_migrator LOGIN PASSWORD '<migrator>';
CREATE ROLE agroconnect_app LOGIN PASSWORD '<app>';
CREATE ROLE agroconnect_backup LOGIN PASSWORD '<backup>';

CREATE DATABASE agroconnect OWNER agroconnect_migrator;
\c agroconnect
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE SCHEMA IF NOT EXISTS agroconnect AUTHORIZATION agroconnect_migrator;

GRANT CONNECT ON DATABASE agroconnect TO agroconnect_app, agroconnect_backup;
GRANT USAGE ON SCHEMA agroconnect TO agroconnect_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA agroconnect
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO agroconnect_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA agroconnect
  GRANT USAGE, SELECT ON SEQUENCES TO agroconnect_app;
```

**Regla:** la API nunca usa el rol dueño ni superusuario; migraciones usan un rol separado.

**Criterio de salida:** contenedor sano, TLS, roles y backup probados.

---

### Fase 3 — Exportar Supabase (0,5 día)

1. Solicitar/confirmar la URL directa de Supabase (sin pooler para dump).
2. Ejecutar:

```bash
pg_dump "$SUPABASE_DB_URL" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --schema=agroconnect \
  --file=supabase-agroconnect.dump
```

3. Verificar el dump:

```bash
pg_restore --list supabase-agroconnect.dump | head -50
pg_restore --list supabase-agroconnect.dump | wc -l
```

4. Guardar checksum y fecha.
5. No commitear el dump ni la URL.

**Criterio de salida:** dump restaurable y checksum registrado.

---

### Fase 4 — Restaurar en Docker (1 día)

En un ambiente aislado, no en producción:

```bash
createdb -h 127.0.0.1 -p 5434 -U agroconnect agroconnect_restore
pg_restore \
  --host=127.0.0.1 \
  --port=5434 \
  --username=agroconnect \
  --dbname=agroconnect_restore \
  --no-owner \
  --no-privileges \
  supabase-agroconnect.dump
```

Luego:

```bash
cd apps/api
DATABASE_URL="postgresql://agroconnect:<password>@127.0.0.1:5434/agroconnect_restore" \
DATABASE_SCHEMA=agroconnect \
  npx prisma migrate deploy

DATABASE_URL="..." DATABASE_SCHEMA=agroconnect npx prisma migrate status
```

Verificar:

- tablas, filas y secuencias;
- constraints e índices;
- usuarios, productos, parcelas y refresh tokens;
- login, refresh, perfil y marketplace;
- `prisma migrate status` sin drift.

**Criterio de salida:** base restaurada y API funcionando contra ella.

---

### Fase 5 — Cutover de producción (1 día)

1. Avisar ventana de mantenimiento.
2. Congelar escrituras en Supabase.
3. Tomar dump final.
4. Restaurar en el PostgreSQL Docker de producción.
5. Ejecutar `prisma migrate deploy`.
6. Cambiar en Render:
   - `DATABASE_URL` al nuevo host.
   - `DATABASE_SCHEMA=agroconnect`.
   - `sslmode=require` si aplica.
7. Redeploy.
8. Verificar:
   ```bash
   curl -i https://agroconnect-api-5t7n.onrender.com/health
   curl -i https://agroconnect-api-5t7n.onrender.com/health/ready
   ```
9. Probar login, refresh, perfil, productos, publicación y parcelas.
10. Mantener Supabase en solo lectura durante 30 días como rollback.

**Criterio de salida:** `/ready` 200, login real y operaciones críticas correctas.

---

### Fase 6 — Estabilización y retiro de Supabase (1 semana)

- Monitorear errores, latencia DB, conexiones y disco.
- Ejecutar backup y restauración de prueba.
- Retirar variables `SUPABASE_*` del frontend y Render.
- Revocar API keys y contraseñas de Supabase.
- Archivar dump final.
- Eliminar el proyecto Supabase después de 30 días.
- Actualizar README, runbooks, manifiesto y Obsidian.

**Criterio de salida:** Supabase apagado, backup restaurado y documentación actualizada.

---

## 5. Matriz de aceptación

| Control | Criterio |
| --- | --- |
| Local | `docker compose up -d` + migraciones + tests |
| Producción | `/health` 200 y `/ready` 200 |
| TLS | `sslmode=require` verificado |
| Privilegios | API sin superusuario ni DDL |
| Datos | Conteos de tablas y secuencias coinciden |
| Migraciones | `prisma migrate status` sin drift |
| Backup | `pg_dump` restaurado en base aislada |
| Rollback | Supabase disponible en solo lectura 30 días |
| Seguridad | `5432` no expuesto a Internet abierto |
| Documentación | Runbook y variables actualizados |

---

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
| --- | --- |
| Pérdida de datos en el corte | dump final + checksum + rollback Supabase |
| Contenedor sin volumen persistente | volumen nombrado en `/srv/agroconnect/pgdata` |
| Reinicio del VPS | `restart: unless-stopped` y backup externo |
| Puerto 5432 abierto | firewall + allowlist de Render |
| TLS mal configurado | `sslmode=require` y prueba negativa sin TLS |
| Pool de conexiones agotado | PgBouncer o límites de Prisma/Render |
| Migración con drift | `prisma migrate deploy` en base restaurada antes del cutover |
| RLS/roles inconsistentes | probar con `agroconnect_app`, no con el dueño |
| Supabase eliminado antes de validar | retención de 30 días |

---

## 7. Cronograma

| Día | Actividad |
| --- | --- |
| 1 | Inventario Supabase y decisión VPS/gestionado |
| 2 | Docker local reproducible y roles |
| 3–4 | PostgreSQL de producción, TLS y backups |
| 5 | Exportar y restaurar en aislado |
| 6 | Validación funcional y migraciones |
| 7 | Cutover, smoke y rollback |
| 8–14 | Estabilización y retiro de Supabase |

---

## 8. Lo que NO se debe hacer

- No usar el contenedor local como producción.
- No abrir `5432` a toda Internet.
- No usar el rol dueño de la base en la API.
- No eliminar Supabase antes de 30 días de validación.
- No commitear dumps, contraseñas ni `DATABASE_URL`.
- No cambiar el esquema comercial (`database/commercial`) por el esquema de producción sin una migración aprobada.

---

## 9. Decisión pendiente

Antes de ejecutar:

1. ¿Docker en **VPS propio** o Postgres gestionado?
2. ¿Dominio y proveedor del VPS?
3. ¿Ventana de mantenimiento?
4. ¿Quién conserva el backup externo?

Sin esas respuestas, el plan puede ejecutarse en local, pero no se debe hacer cutover de producción.
