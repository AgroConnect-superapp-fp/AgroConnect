# Guía de arranque — PostgreSQL 16 + PostGIS 3.4

Esta guía resuelve el hallazgo **"La conexión a PostgreSQL con PostGIS en los equipos del equipo — Pendiente"** de la clasificación de hallazgos del entregable 06. Sigue los pasos en el orden indicado; al final tendrás la base de datos lista para correr las migraciones del proyecto.

## 1. Requisitos

| Herramienta | Verificación |
|---|---|
| Docker 24+ | `docker --version` |
| Node.js 20+ | `node --version` |

No necesitas instalar PostgreSQL en el sistema: se usa un contenedor oficial con PostGIS ya incluido (`postgis/postgis:16-3.4`).

## 2. Levantar la base de datos (recomendado)

```bash
docker run -d --name agroconnect-postgres \
  -e POSTGRES_USER=agroconnect \
  -e POSTGRES_PASSWORD=agroconnect_dev \
  -e POSTGRES_DB=agroconnect_dev \
  -p 5434:5432 \
  --health-cmd "pg_isready -U agroconnect" \
  --health-interval 5s \
  --health-timeout 3s \
  --health-retries 10 \
  postgis/postgis:16-3.4
```

El puerto **5434** evita conflictos con otros PostgreSQL locales (que suelen usar 5432 o 5433).

Verifica que el contenedor esté sano:

```bash
docker ps --filter name=agroconnect-postgres
# STATUS debe decir "Up ... (healthy)"
```

## 3. Crear la base de datos de pruebas

```bash
docker exec agroconnect-postgres psql -U agroconnect -d agroconnect_dev \
  -c "CREATE DATABASE agroconnect_test;"
```

## 4. Verificar PostGIS

```bash
docker exec agroconnect-postgres psql -U agroconnect -d agroconnect_dev \
  -c "SELECT PostGIS_Version();"
```

Debe responder algo como `3.4 USE_GEOS=1 USE_PROJ=1 USE_STATS=1`. La extensión ya viene activada en la imagen; la migración del proyecto también la declara con `CREATE EXTENSION IF NOT EXISTS postgis`, de modo que cualquier entorno nuevo queda cubierto.

## 5. Configurar el backend

```bash
cd backend
cp .env.example .env
```

El `.env` ya apunta a este contenedor:

```
DATABASE_URL="postgresql://agroconnect:agroconnect_dev@localhost:5434/agroconnect_dev?schema=public"
TEST_DATABASE_URL="postgresql://agroconnect:agroconnect_dev@localhost:5434/agroconnect_test?schema=public"
```

Genera los secretos JWT con `openssl rand -hex 32` y pégalos en `JWT_ACCESS_SECRET` y `JWT_REFRESH_SECRET`.

## 6. Aplicar migraciones

```bash
npm install
npx prisma generate
npx prisma migrate dev
```

La migración `init_auth` crea las cinco tablas (`users`, `roles`, `producer_profiles`, `company_profiles`, `refresh_tokens`), la columna geoespacial `coordenadas geography(Point, 4326)` con índice GIST, y siembra el catálogo de los cinco roles.

Aplica también a la base de pruebas:

```bash
DATABASE_URL="postgresql://agroconnect:agroconnect_dev@localhost:5434/agroconnect_test?schema=public" \
  npx prisma migrate deploy
```

### Advertencia: `prisma migrate dev` y los índices GIST

Prisma no puede representar índices GIST sobre columnas `Unsupported("geography(...)")` en el schema. Por eso, cada vez que se ejecute `npx prisma migrate dev`, Prisma puede generar una migración espuria que elimina los índices espaciales creados manualmente en las migraciones (`producer_profiles_coordenadas_gist_idx` y, en M16, `plots_centroid_gist_idx`). Esto ya ocurrió una vez (migración `20260928062141`, cuarentenada el 2 de octubre de 2026).

Reglas del proyecto para prevenir el problema:

1. **Nunca** aceptar una migración generada que contenga `DROP INDEX` sobre un índice `*_gist_idx`.
2. Usar `npx prisma migrate dev --create-only`, revisar el SQL y eliminar cualquier `DROP INDEX` espurio antes de aplicar la migración.
3. Si el DROP ya se aplicó, recrear el índice:

   ```sql
   CREATE INDEX IF NOT EXISTS "producer_profiles_coordenadas_gist_idx"
     ON "producer_profiles" USING GIST ("coordenadas");
   ```

4. Verificar después de cada migración con `\di producer_profiles*` que el índice GIST sigue presente.

## 7. Verificación final

```bash
npm test -- --coverage     # 178 pruebas, cobertura ≥ 80 %
npm run dev                # API en http://localhost:4000
curl http://localhost:4000/health
```

## 8. Comandos de uso diario

```bash
docker start agroconnect-postgres     # tras reiniciar el equipo
docker stop agroconnect-postgres
docker logs agroconnect-postgres      # revisar errores

# consola SQL directa
docker exec -it agroconnect-postgres psql -U agroconnect -d agroconnect_dev

# estado de migraciones
cd backend && npx prisma migrate status
```

## Alternativa sin Docker (PostgreSQL local)

1. Instala PostgreSQL 16 desde el gestor de paquetes de tu sistema.
2. Instala PostGIS 3.4 (`postgresql-16-postgis-3` en Debian/Ubuntu).
3. Crea usuario y bases:

```sql
CREATE USER agroconnect WITH PASSWORD 'agroconnect_dev';
CREATE DATABASE agroconnect_dev OWNER agroconnect;
CREATE DATABASE agroconnect_test OWNER agroconnect;
\c agroconnect_dev
CREATE EXTENSION IF NOT EXISTS postgis;
\c agroconnect_test
CREATE EXTENSION IF NOT EXISTS postgis;
```

4. Ajusta `DATABASE_URL` y `TEST_DATABASE_URL` en `backend/.env` al puerto local (5432 por defecto).

## Problemas comunes

| Síntoma | Causa y solución |
|---|---|
| `port is already allocated` | Otro PostgreSQL usa el 5434. Cambia el puerto (`-p 5435:5432`) y actualiza `DATABASE_URL`. |
| `Can't reach database server at localhost:5434` | El contenedor no está corriendo: `docker start agroconnect-postgres`. |
| `type "geography" does not exist` | La extensión PostGIS no está activa en esa base. Ejecuta `CREATE EXTENSION postgis;` en ella o usa la imagen `postgis/postgis`. |
| `P1001` en Prisma | Credenciales o puerto incorrectos en `DATABASE_URL`; verifica con `docker exec ... psql`. |
| Pruebas de integración fallan con `relation does not exist` | Falta aplicar migraciones a `agroconnect_test` (paso 6). |

## Referencias

- Imagen oficial: [postgis/postgis en Docker Hub](https://hub.docker.com/r/postgis/postgis)
- Prisma Migrate: [docs.prisma.io](https://www.prisma.io/docs/orm/prisma-migrate)
- Documentación del proyecto: `backend/README.md`, `.opencode/SPEC.md`
