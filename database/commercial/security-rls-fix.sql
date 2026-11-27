-- H05: funciones SECURITY DEFINER para evitar recursión entre políticas RLS.
CREATE OR REPLACE FUNCTION rls_current_user()
RETURNS BIGINT
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::BIGINT;
$$;

CREATE OR REPLACE FUNCTION rls_owns_publication(p_publicacion BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM publicaciones
    WHERE id_publicacion = p_publicacion
      AND id_usuario = rls_current_user()
  );
$$;

CREATE OR REPLACE FUNCTION rls_owns_order(p_pedido BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM pedidos
    WHERE id_pedido = p_pedido
      AND id_comprador = rls_current_user()
  );
$$;

CREATE OR REPLACE FUNCTION rls_receives_order(p_pedido BIGINT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM detalle_pedido d
    JOIN publicaciones p ON p.id_publicacion = d.id_publicacion
    WHERE d.id_pedido = p_pedido
      AND p.id_usuario = rls_current_user()
  );
$$;

GRANT EXECUTE ON FUNCTION rls_current_user(), rls_owns_publication(BIGINT), rls_owns_order(BIGINT), rls_receives_order(BIGINT) TO agroconnect_app, agroconnect_admin;

DROP POLICY IF EXISTS productor_publicaciones ON publicaciones;
CREATE POLICY productor_publicaciones ON publicaciones
  FOR ALL TO agroconnect_app
  USING (id_usuario = rls_current_user());

DROP POLICY IF EXISTS productor_inventario ON inventario;
CREATE POLICY productor_inventario ON inventario
  FOR ALL TO agroconnect_app
  USING (id_usuario = rls_current_user());

DROP POLICY IF EXISTS productor_lotes ON lotes_perecederos;
CREATE POLICY productor_lotes ON lotes_perecederos
  FOR ALL TO agroconnect_app
  USING (rls_owns_publication(id_publicacion));

DROP POLICY IF EXISTS comprador_pedidos ON pedidos;
CREATE POLICY comprador_pedidos ON pedidos
  FOR ALL TO agroconnect_app
  USING (id_comprador = rls_current_user());

DROP POLICY IF EXISTS comprador_detalle ON detalle_pedido;
CREATE POLICY comprador_detalle ON detalle_pedido
  FOR SELECT TO agroconnect_app
  USING (rls_owns_order(id_pedido));

DROP POLICY IF EXISTS productor_pedidos_recibidos ON pedidos;
CREATE POLICY productor_pedidos_recibidos ON pedidos
  FOR SELECT TO agroconnect_app
  USING (rls_receives_order(id_pedido));

DROP POLICY IF EXISTS productor_detalle ON detalle_pedido;
CREATE POLICY productor_detalle ON detalle_pedido
  FOR SELECT TO agroconnect_app
  USING (rls_owns_publication(id_publicacion));

DROP POLICY IF EXISTS comprador_transacciones ON transacciones_pago;
CREATE POLICY comprador_transacciones ON transacciones_pago
  FOR SELECT TO agroconnect_app
  USING (rls_owns_order(id_pedido));

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO agroconnect_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO agroconnect_admin;
