-- Roles mínimos del modelo comercial (crear como administrador de BD).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'agroconnect_app') THEN
    CREATE ROLE agroconnect_app NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'agroconnect_admin') THEN
    CREATE ROLE agroconnect_admin NOLOGIN;
  END IF;
END
$$;

-- Habilitar RLS en las tablas sensibles (H05)
ALTER TABLE publicaciones    ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_pedido   ENABLE ROW LEVEL SECURITY;
ALTER TABLE envios           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lotes_perecederos ENABLE ROW LEVEL SECURITY;

-- Productor: publicaciones, inventario y lotes propios
CREATE POLICY productor_publicaciones ON publicaciones
  FOR ALL TO agroconnect_app
  USING (id_usuario = current_setting('app.current_user_id')::BIGINT);

CREATE POLICY productor_inventario ON inventario
  FOR ALL TO agroconnect_app
  USING (id_usuario = current_setting('app.current_user_id')::BIGINT);

CREATE POLICY productor_lotes ON lotes_perecederos
  FOR ALL TO agroconnect_app
  USING (id_publicacion IN (
    SELECT id_publicacion FROM publicaciones
    WHERE id_usuario = current_setting('app.current_user_id')::BIGINT
  ));

-- Comprador: pedidos propios y su detalle
CREATE POLICY comprador_pedidos ON pedidos
  FOR ALL TO agroconnect_app
  USING (id_comprador = current_setting('app.current_user_id')::BIGINT);

CREATE POLICY comprador_detalle ON detalle_pedido
  FOR SELECT TO agroconnect_app
  USING (id_pedido IN (
    SELECT id_pedido FROM pedidos
    WHERE id_comprador = current_setting('app.current_user_id')::BIGINT
  ));

-- Productor: pedidos recibidos y detalle de sus publicaciones
CREATE POLICY productor_pedidos_recibidos ON pedidos
  FOR SELECT TO agroconnect_app
  USING (EXISTS (
    SELECT 1 FROM detalle_pedido d
    JOIN publicaciones p ON p.id_publicacion = d.id_publicacion
    WHERE d.id_pedido = pedidos.id_pedido
      AND p.id_usuario = current_setting('app.current_user_id')::BIGINT
  ));

CREATE POLICY productor_detalle ON detalle_pedido
  FOR SELECT TO agroconnect_app
  USING (id_publicacion IN (
    SELECT id_publicacion FROM publicaciones
    WHERE id_usuario = current_setting('app.current_user_id')::BIGINT
  ));

-- Operador logístico: envíos asignados
CREATE POLICY operador_envios ON envios
  FOR ALL TO agroconnect_app
  USING (id_transportista IN (
    SELECT id_transportista FROM transportistas
    WHERE id_usuario = current_setting('app.current_user_id')::BIGINT
  ));

-- Administración: lectura total con auditoría; no se usa para operaciones de negocio
CREATE POLICY admin_publicaciones ON publicaciones FOR ALL TO agroconnect_admin USING (true);
CREATE POLICY admin_inventario ON inventario FOR ALL TO agroconnect_admin USING (true);
CREATE POLICY admin_pedidos ON pedidos FOR ALL TO agroconnect_admin USING (true);
CREATE POLICY admin_detalle ON detalle_pedido FOR ALL TO agroconnect_admin USING (true);
CREATE POLICY admin_envios ON envios FOR ALL TO agroconnect_admin USING (true);
CREATE POLICY admin_lotes ON lotes_perecederos FOR ALL TO agroconnect_admin USING (true);

-- Permisos mínimos por tabla (el rol no es dueño ni superusuario)
GRANT SELECT, INSERT, UPDATE, DELETE ON publicaciones, inventario, pedidos, detalle_pedido, envios, lotes_perecederos TO agroconnect_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO agroconnect_app;



-- Validación de que la fecha de vencimiento de un lote es posterior a la cosecha
ALTER TABLE lotes_perecederos
  ADD CONSTRAINT chk_lote_fechas
  CHECK (fecha_vencimiento > fecha_cosecha);

-- Validación de que el rango de temperatura es coherente
ALTER TABLE lotes_perecederos
  ADD CONSTRAINT chk_lote_temperatura
  CHECK (temperatura_min IS NULL OR temperatura_max IS NULL OR temperatura_min <= temperatura_max);

-- Validación de que la cantidad disponible no excede la cantidad inicial
ALTER TABLE lotes_perecederos
  ADD CONSTRAINT chk_lote_cantidad
  CHECK (cantidad_disponible <= cantidad_inicial AND cantidad_disponible >= 0);

-- Validación del estado de transacciones de pago
ALTER TABLE transacciones_pago
  ADD CONSTRAINT chk_transaccion_estado
  CHECK (estado_transaccion IN ('iniciada','pendiente','aprobada','rechazada','reversada'));

-- Validación de que la fecha de confirmación es posterior a la iniciación
ALTER TABLE transacciones_pago
  ADD CONSTRAINT chk_transaccion_fechas
  CHECK (fecha_confirmacion IS NULL OR fecha_confirmacion >= fecha_iniciacion);


-- Trigger que valida stock disponible antes de aceptar un ítem de pedido
CREATE OR REPLACE FUNCTION fn_validar_stock_pedido()
RETURNS TRIGGER AS $$
BEGIN
  -- Reserva atómica: la condición y el descuento ocurren en una sola sentencia.
  UPDATE publicaciones
  SET cantidad_disponible = cantidad_disponible - NEW.cantidad
  WHERE id_publicacion = NEW.id_publicacion
    AND cantidad_disponible >= NEW.cantidad;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Stock insuficiente para la publicación %. Solicitado: %',
      NEW.id_publicacion, NEW.cantidad;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_validar_stock
BEFORE INSERT ON detalle_pedido
FOR EACH ROW EXECUTE FUNCTION fn_validar_stock_pedido();

-- Trigger que genera automáticamente alertas de vencimiento a 72h, 48h y 24h
CREATE OR REPLACE FUNCTION fn_generar_alertas_vencimiento()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO alertas_vencimiento (id_lote, tipo_alerta, fecha_alerta)
  VALUES
    (NEW.id_lote, '72h', NEW.fecha_vencimiento - INTERVAL '72 hours'),
    (NEW.id_lote, '48h', NEW.fecha_vencimiento - INTERVAL '48 hours'),
    (NEW.id_lote, '24h', NEW.fecha_vencimiento - INTERVAL '24 hours');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_alertas_vencimiento
AFTER INSERT ON lotes_perecederos
FOR EACH ROW EXECUTE FUNCTION fn_generar_alertas_vencimiento();


-- H06: datos financieros. Solo el comprador propietario y el administrador.
ALTER TABLE transacciones_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE conciliaciones_dian ENABLE ROW LEVEL SECURITY;

CREATE POLICY comprador_transacciones ON transacciones_pago
  FOR SELECT TO agroconnect_app
  USING (id_pedido IN (
    SELECT id_pedido FROM pedidos
    WHERE id_comprador = current_setting('app.current_user_id')::BIGINT
  ));

CREATE POLICY admin_transacciones ON transacciones_pago
  FOR ALL TO agroconnect_admin USING (true);

CREATE POLICY admin_conciliaciones ON conciliaciones_dian
  FOR ALL TO agroconnect_admin USING (true);

GRANT SELECT, INSERT, UPDATE ON transacciones_pago TO agroconnect_app;
GRANT SELECT ON conciliaciones_dian TO agroconnect_app;

-- Administración: privilegios de lectura/operación del esquema comercial.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO agroconnect_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO agroconnect_admin;
