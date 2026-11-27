-- H06: datos financieros. Solo el comprador propietario y el administrador.
ALTER TABLE transacciones_pago ENABLE ROW LEVEL SECURITY;
ALTER TABLE conciliaciones_dian ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comprador_transacciones ON transacciones_pago;
CREATE POLICY comprador_transacciones ON transacciones_pago
  FOR SELECT TO agroconnect_app
  USING (id_pedido IN (
    SELECT id_pedido FROM pedidos
    WHERE id_comprador = current_setting('app.current_user_id')::BIGINT
  ));

DROP POLICY IF EXISTS admin_transacciones ON transacciones_pago;
CREATE POLICY admin_transacciones ON transacciones_pago
  FOR ALL TO agroconnect_admin USING (true);

DROP POLICY IF EXISTS admin_conciliaciones ON conciliaciones_dian;
CREATE POLICY admin_conciliaciones ON conciliaciones_dian
  FOR ALL TO agroconnect_admin USING (true);

GRANT SELECT, INSERT, UPDATE ON transacciones_pago TO agroconnect_app;
GRANT SELECT ON conciliaciones_dian TO agroconnect_app;
