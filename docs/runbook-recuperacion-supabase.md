# Runbook — recuperación de la base de producción (Supabase)

**Síntoma:** `/health` responde 200 pero `/health/ready` responde 503; login y
`/plots/nearby` devuelven 500; el marketplace cae al modo demo.

**Diagnóstico reproducible:**

```bash
node scripts/diagnose-production.mjs
```

Salida del 2026-11-02: **8/11 OK**, con fallos en `DNS Supabase` (ENOTFOUND),
`/health/ready` (503) y login (500). El pooler
`aws-1-sa-east-1.pooler.supabase.com` resuelve y acepta TCP, pero el proyecto
`fwmaehhzfydbhilpfbrl.supabase.co` no existe en DNS.

---

## 1. Revisar el proyecto en Supabase

1. Entrar a <https://supabase.com/dashboard>.
2. Buscar el proyecto con ref **`fwmaehhzfydbhilpfbrl`**.
3. Si está **pausado**: restaurarlo y esperar a que el estado sea `Active`.
4. Si fue **eliminado**: crear un proyecto nuevo en la misma región
   (`sa-east-1`), anotar la nueva ref y continuar con el paso 2.

> El proyecto del marketplace y el de autenticación son el mismo. Si se crea
> uno nuevo, hay que actualizar también `VITE_SUPABASE_URL` y
> `VITE_SUPABASE_ANON_KEY` en Vercel (Production y Preview).

## 2. Actualizar la conexión en Render

En **Render → agroconnect-api → Environment**:

| Variable | Valor |
|---|---|
| `DATABASE_URL` | Connection string del **Session pooler** de Supabase (usuario `postgres.<ref>`, contraseña vigente) |
| `DATABASE_SCHEMA` | `agroconnect` |
| `TRUST_PROXY` | `1` |
| `CORS_ORIGIN` | `https://agroconnectpreview.vercel.app` |

Guardar y hacer **Manual Deploy** (o esperar el auto-deploy de `main`).

## 3. Crear el esquema y aplicar migraciones

Con la URL directa o el Session pooler (no el transaction pooler para
migraciones):

```bash
export SUPABASE_DB_URL='postgresql://postgres.<ref>:<PASSWORD>@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?schema=agroconnect'

psql "$SUPABASE_DB_URL" -c "CREATE SCHEMA IF NOT EXISTS agroconnect;"

cd apps/api
DATABASE_URL="$SUPABASE_DB_URL" DATABASE_SCHEMA=agroconnect npx prisma migrate deploy
npx prisma migrate status
```

Criterio de aceptación: `All migrations have been successfully applied` y
`Database schema is up to date!`.

## 4. Verificar el readiness

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://agroconnect-api-5t7n.onrender.com/health
curl -s -o /dev/null -w '%{http_code}\n' https://agroconnect-api-5t7n.onrender.com/health/ready
```

Esperado: `200` y `200`. Si `/health/ready` sigue en 503, revisar en Render →
Logs el `correlationId` de la petición; los errores típicos son `P1001`
(host/credenciales), `P2021` (tabla inexistente) o `P3014` (schema).

## 5. RLS y cuentas administradoras

```bash
psql "$SUPABASE_DB_URL" -f scripts/verify-supabase-rls.sql
psql "$SUPABASE_DB_URL" -f scripts/audit-admin-users.sql
```

- Si `properties` no tiene RLS: habilitarlo y definir políticas; mientras tanto,
  retirar los permisos de escritura de `anon`/`authenticated`.
- Suspender cualquier cuenta `administrador` no reconocida creada desde el
  2026-10-07.

## 6. Verificar el login real

1. Abrir <https://agroconnectpreview.vercel.app> y registrar/iniciar sesión.
2. DevTools → Application → Cookies:
   - `access_token` y `refresh_token`.
   - `HttpOnly` ✓, `Secure` ✓, `SameSite=None` ✓.
   - El cuerpo de `/auth/login` **no** debe contener `tokens`.
3. Recargar la página: el refresh silencioso debe restaurar la sesión.
4. Cerrar sesión: las cookies deben desaparecer.

## 7. Rollback

- No revertir migraciones en caliente. Si una migración corrupta lo exige,
  restaurar el backup de Supabase (Database → Backups) y redesplegar.
- Frontend: Vercel → Deployments → deployment anterior → **Promote to Production**.
- Backend: Render → deploy anterior → **Redeploy**.

## 8. Cierre

```bash
node scripts/diagnose-production.mjs   # debe salir 11/11 OK
```

Actualizar `docs/auditoria-2026-11-02.md` y la nota `Estado del Proyecto` de
Obsidian con el resultado.
