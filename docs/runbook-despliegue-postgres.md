# Runbook — despliegue de AgroConnect con PostgreSQL propio

**Objetivo:** sustituir la dependencia de Supabase por un PostgreSQL 16 +
PostGIS 3.4 administrado en el entorno definitivo, y verificar API, frontend,
marketplace y publicación de productos.

> Requisitos: PostgreSQL 16, extensión PostGIS 3.4, Node.js 24, acceso a la API
> y al frontend. No se necesitan credenciales de Supabase.

---

## 1. Base de datos

Crear una base y un rol con privilegios mínimos (no usar `postgres` en runtime):

```sql
CREATE ROLE agroconnect_app LOGIN PASSWORD '<password-fuerte>';
CREATE DATABASE agroconnect OWNER agroconnect_app;
\c agroconnect
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE SCHEMA IF NOT EXISTS agroconnect AUTHORIZATION agroconnect_app;
```

Cadena de conexión:

```text
postgresql://agroconnect_app:<password>@<host>:5432/agroconnect?sslmode=require
```

En el runtime, `DATABASE_SCHEMA=agroconnect` y `DATABASE_URL` deben apuntar a
esa base. Para migraciones se recomienda una conexión directa (sin pooler de
transacciones).

## 2. Variables de entorno de la API

Configurar en el proveedor (Render u otro) sin commitear valores:

- `DATABASE_URL`, `DATABASE_SCHEMA=agroconnect`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (mínimo 32 caracteres)
- `JWT_ACCESS_EXPIRES_IN=15m`, `JWT_REFRESH_EXPIRES_IN=7d`
- `JWT_ISSUER=agroconnect-api`, `JWT_AUDIENCE=agroconnect-web`
- `CORS_ORIGIN=https://<frontend>`
- `APP_BASE_URL=https://<frontend>`
- `TRUST_PROXY=1` si está detrás de un proxy
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `SMTP_FROM`
- `LOG_LEVEL=info`, `NODE_ENV=production`

## 3. Migraciones y seed

```bash
npm ci
npm run prisma:generate -w @agroconnect/api
DATABASE_URL='<url>' DATABASE_SCHEMA=agroconnect \
  npm run prisma:deploy -w @agroconnect/api
DATABASE_URL='<url>' DATABASE_SCHEMA=agroconnect \
  npm run prisma:status -w @agroconnect/api
```

Opcional para un catálogo inicial:

```bash
DATABASE_URL='<url>' DATABASE_SCHEMA=agroconnect \
  npm run seed:products -w @agroconnect/api
```

## 4. Verificación de la API

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://<api>/health
curl -s -o /dev/null -w '%{http_code}\n' https://<api>/health/ready
curl -s 'https://<api>/api/v1/products?limit=2'
```

Esperado: `200`, `200` y un JSON con `success: true`. Si readiness falla,
revisar `DATABASE_URL`, el schema y los logs de Prisma (`P1001`, `P2021`,
`P3014`).

## 5. Frontend

Configurar en Vercel (Production y Preview):

- `VITE_API_URL=https://<api>`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

El marketplace ya no usa `VITE_SUPABASE_*`. Verificar que el modo demo carga
aunque la API no responda y que el registro/login usa cookies httpOnly.

## 6. Smoke test de Cloudinary

Con el preset unsigned configurado:

```bash
CLOUDINARY_CLOUD_NAME='<cloud>' CLOUDINARY_UPLOAD_PRESET='<preset>' \
  npm run smoke:cloudinary
```

También acepta `VITE_CLOUDINARY_CLOUD_NAME` y
`VITE_CLOUDINARY_UPLOAD_PRESET`. El script sube un PNG 1×1 sin PII y solo
imprime `public_id` y `secure_url`. Si falla, revisar que el preset sea
unsigned y permita subidas desde el dominio del frontend.

## 7. Verificación funcional

1. Abrir el frontend y pulsar **Explorar la demo**.
2. Registrar un productor, verificar el correo y publicar una cosecha con
   imagen.
3. Registrar una empresa B2B con tipo, NIT, departamento y municipio.
4. Registrar un transportista con placa, capacidad, cobertura, cadena de frío
   y vigencias.
5. Confirmar que el producto publicado aparece en `/api/v1/products` y en el
   marketplace.

## 8. Rollback y respaldo

- Tomar backup antes de aplicar migraciones.
- No revertir migraciones en caliente; restaurar backup y redesplegar.
- Frontend: promover el deployment anterior en Vercel.
- API: redeploy de la versión anterior en Render.
- Si se cambia de base, conservar la anterior en solo lectura durante la
  ventana de verificación.

## 9. Seguridad mínima

- Rol de aplicación sin `SUPERUSER`; `postgres` solo para migraciones.
- TLS obligatorio (`sslmode=require`).
- Secretos solo en el proveedor, nunca en Git.
- Backup automático y prueba de restauración.
- Rate limiting y cookies `Secure` ya están configurados en la API.
