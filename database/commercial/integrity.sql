-- Integridad H07–H09 para el esquema comercial.
-- Ejecutar después de schema.sql y security.sql.

-- H09: una sola liberación de stock por detalle y por pedido cancelado.
ALTER TABLE detalle_pedido
  ADD COLUMN IF NOT EXISTS stock_liberado BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION fn_liberar_stock_detalle()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stock_liberado = FALSE THEN
    UPDATE publicaciones
    SET cantidad_disponible = cantidad_disponible + OLD.cantidad
    WHERE id_publicacion = OLD.id_publicacion;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_liberar_stock_detalle ON detalle_pedido;
CREATE TRIGGER tg_liberar_stock_detalle
AFTER DELETE ON detalle_pedido
FOR EACH ROW EXECUTE FUNCTION fn_liberar_stock_detalle();

CREATE OR REPLACE FUNCTION fn_liberar_stock_pedido_cancelado()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado = 'cancelado' AND OLD.estado IS DISTINCT FROM 'cancelado' THEN
    UPDATE detalle_pedido
    SET stock_liberado = TRUE
    WHERE id_pedido = NEW.id_pedido AND stock_liberado = FALSE;

    UPDATE publicaciones p
    SET cantidad_disponible = p.cantidad_disponible + d.cantidad
    FROM detalle_pedido d
    WHERE d.id_pedido = NEW.id_pedido
      AND d.id_publicacion = p.id_publicacion
      AND d.stock_liberado = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM movimientos_inventario m
        WHERE m.id_inventario IS NULL AND m.descripcion = 'liberacion:' || d.id_detalle
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_liberar_stock_pedido_cancelado ON pedidos;
CREATE TRIGGER tg_liberar_stock_pedido_cancelado
AFTER UPDATE OF estado ON pedidos
FOR EACH ROW EXECUTE FUNCTION fn_liberar_stock_pedido_cancelado();

-- H07: un pedido no puede confirmarse sin ítems.
CREATE OR REPLACE FUNCTION fn_validar_pedido_con_items()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estado IN ('aceptado','enviado','entregado')
     AND NOT EXISTS (SELECT 1 FROM detalle_pedido WHERE id_pedido = NEW.id_pedido) THEN
    RAISE EXCEPTION 'El pedido % no puede pasar a % sin ítems', NEW.id_pedido, NEW.estado;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_validar_pedido_con_items ON pedidos;
CREATE TRIGGER tg_validar_pedido_con_items
BEFORE UPDATE OF estado ON pedidos
FOR EACH ROW EXECUTE FUNCTION fn_validar_pedido_con_items();
