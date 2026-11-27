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
esa base. El `docker-compose.yml` local usa el nombre `agroconnect_dev`; usa
`agroconnect` en el entorno administrado. Para migraciones se recomienda una conexión directa (sin pooler de
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
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_UPLOAD_FOLDER=agroconnect/products`
  (las tres primeras se configuran juntas; sin ellas la firma de subida responde 503)
- `LOG_LEVEL=info`, `NODE_ENV=production`

## 3. Migraciones, seed y administrador

Después de aplicar migraciones, provisiona la cuenta administradora que usará
la pantalla de moderación:

```bash
ADMIN_EMAIL='admin@<dominio>' ADMIN_PASSWORD='<password-fuerte>' \
ADMIN_NAME='Administrador AgroConnect' ADMIN_DOCUMENT='<documento>' \
ADMIN_PHONE='<celular>' DATABASE_URL='<url>' DATABASE_SCHEMA=agroconnect \
  npm run create:admin -w @agroconnect/api
```

El script no imprime la contraseña y aborta si el correo, documento o celular
ya existen. No hay auto-registro de administradores.

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

El marketplace ya no usa `VITE_SUPABASE_*`. Verificar que el modo demo carga
aunque la API no responda y que el registro/login usa cookies httpOnly.

## 6. Smoke test de Cloudinary

Con las credenciales server-side configuradas:

```bash
CLOUDINARY_CLOUD_NAME='<cloud>' CLOUDINARY_API_KEY='<key>' \
CLOUDINARY_API_SECRET='<secret>' npm run smoke:cloudinary
```

El script firma la subida con SHA-1, sube un PNG 1×1 sin PII y solo imprime
`public_id` y `secure_url`. También acepta la URL estándar
`CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>`.
Si falla, revisar que las credenciales pertenezcan al mismo cloud y que la
carpeta `agroconnect/smoke` sea escribible. El límite real de tamaño de archivo se configura en la cuenta de Cloudinary; `maxBytes` del frontend es solo validación de UX.

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
