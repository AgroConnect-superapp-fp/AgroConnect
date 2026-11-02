-- ─────────────────────────────────────────────────────────────────────────────
-- Auditoría de cuentas administradoras — AgroConnect
--
-- Contexto: hasta el despliegue del hotfix de seguridad (2026-11-02), el
-- registro de producción aceptaba el rol `administrador` desde el formulario
-- público. Ejecutar contra la base de producción (Supabase) y revisar cada
-- cuenta. NO ejecutar el UPDATE sin validar antes la lista con el equipo.
--
-- Uso:
--   psql "$DATABASE_URL" -f scripts/audit-admin-users.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) Cuentas administradoras creadas desde el inicio de la ventana expuesta.
SELECT
  u.id,
  u.nombre_completo,
  u.correo,
  u.documento,
  u.fecha_registro,
  u.correo_verificado_en,
  u.estado
FROM users u
JOIN roles r ON r.id = u.rol_id
WHERE r.nombre = 'administrador'
  AND u.fecha_registro >= TIMESTAMPTZ '2026-10-07 00:00:00-05'
ORDER BY u.fecha_registro;

-- 2) Suspensión de cuentas no reconocidas (descomentar y completar los IDs).
-- UPDATE users
-- SET estado = 'SUSPENDIDO'
-- WHERE id IN ('<uuid-1>', '<uuid-2>');

-- 3) Revocación de todas las sesiones de esas cuentas (opcional, defensa en
--    profundidad: la rotación de cookies ya invalida las sesiones al desplegar).
-- UPDATE refresh_tokens
-- SET revocado = TRUE
-- WHERE user_id IN ('<uuid-1>', '<uuid-2>');
