-- ─────────────────────────────────────────────────────────────────────────────
-- Verificación de RLS en Supabase — AgroConnect
--
-- La anon key de Supabase es pública por diseño: si una tabla del esquema
-- `public` no tiene RLS, cualquiera puede leer/escribir con esa clave. Ejecutar
-- con una conexión directa a la base de Supabase (service role / psql) y
-- confirmar que `properties` y el resto de tablas expuestas tienen RLS.
--
-- Uso:
--   psql "$SUPABASE_DATABASE_URL" -f scripts/verify-supabase-rls.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Tablas del esquema público y estado de RLS.
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2) Políticas existentes (si no hay filas para una tabla con RLS, esa tabla
--    queda inaccesible para anon/authenticated: revisar si es lo deseado).
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  qual AS using_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3) Privilegios de los roles de Supabase sobre las tablas públicas.
SELECT
  table_schema,
  table_name,
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;
