-- H12: protocolo de sincronización idempotente y versionado por entidad.
-- El cliente envía un uuid_local y la versión que conoce; el servidor decide
-- con su propia versión, no con el reloj del dispositivo.

ALTER TABLE publicaciones   ADD COLUMN IF NOT EXISTS sync_version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE pedidos         ADD COLUMN IF NOT EXISTS sync_version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE inventario      ADD COLUMN IF NOT EXISTS sync_version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE lotes_perecederos ADD COLUMN IF NOT EXISTS sync_version BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS sync_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uuid_local      UUID NOT NULL UNIQUE,
  entity_type     TEXT NOT NULL,
  entity_id       BIGINT NOT NULL,
  operation       TEXT NOT NULL,
  payload         JSONB NOT NULL,
  client_timestamp TIMESTAMPTZ,
  server_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','applied','conflict','error')),
  server_version  BIGINT,
  error_message   TEXT
);

CREATE INDEX IF NOT EXISTS sync_events_entity_idx
  ON sync_events(entity_type, entity_id, server_timestamp DESC);

CREATE OR REPLACE FUNCTION fn_bump_sync_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.sync_version = COALESCE(OLD.sync_version, 0) + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tg_sync_version_publicaciones ON publicaciones;
CREATE TRIGGER tg_sync_version_publicaciones
BEFORE UPDATE ON publicaciones
FOR EACH ROW EXECUTE FUNCTION fn_bump_sync_version();

DROP TRIGGER IF EXISTS tg_sync_version_pedidos ON pedidos;
CREATE TRIGGER tg_sync_version_pedidos
BEFORE UPDATE ON pedidos
FOR EACH ROW EXECUTE FUNCTION fn_bump_sync_version();

DROP TRIGGER IF EXISTS tg_sync_version_inventario ON inventario;
CREATE TRIGGER tg_sync_version_inventario
BEFORE UPDATE ON inventario
FOR EACH ROW EXECUTE FUNCTION fn_bump_sync_version();

DROP TRIGGER IF EXISTS tg_sync_version_lotes ON lotes_perecederos;
CREATE TRIGGER tg_sync_version_lotes
BEFORE UPDATE ON lotes_perecederos
FOR EACH ROW EXECUTE FUNCTION fn_bump_sync_version();

-- Aplicación idempotente de una actualización de publicación.
-- Devuelve: APPLIED, DUPLICATE, CONFLICT o NOT_FOUND.
CREATE OR REPLACE FUNCTION apply_publication_sync(
  p_uuid_local UUID,
  p_publicacion BIGINT,
  p_expected_version BIGINT,
  p_precio NUMERIC,
  p_cantidad NUMERIC,
  p_client_timestamp TIMESTAMPTZ
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_current BIGINT;
  v_inserted INTEGER;
BEGIN
  INSERT INTO sync_events (
    uuid_local, entity_type, entity_id, operation, payload, client_timestamp
  ) VALUES (
    p_uuid_local, 'publicacion', p_publicacion, 'update',
    jsonb_build_object('precio', p_precio, 'cantidad_disponible', p_cantidad),
    p_client_timestamp
  ) ON CONFLICT (uuid_local) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted = 0 THEN
    RETURN 'DUPLICATE';
  END IF;

  SELECT sync_version INTO v_current
  FROM publicaciones
  WHERE id_publicacion = p_publicacion
  FOR UPDATE;

  IF v_current IS NULL THEN
    UPDATE sync_events SET status = 'error', error_message = 'publicacion no existe'
    WHERE uuid_local = p_uuid_local;
    RETURN 'NOT_FOUND';
  END IF;

  -- El timestamp del cliente no decide el orden: solo la versión del servidor.
  IF v_current <> p_expected_version THEN
    UPDATE sync_events
    SET status = 'conflict',
        server_version = v_current,
        error_message = 'version esperada ' || p_expected_version || ', actual ' || v_current
    WHERE uuid_local = p_uuid_local;
    RETURN 'CONFLICT';
  END IF;

  UPDATE publicaciones
  SET precio = p_precio,
      cantidad_disponible = p_cantidad
  WHERE id_publicacion = p_publicacion;

  UPDATE sync_events
  SET status = 'applied', server_version = v_current + 1
  WHERE uuid_local = p_uuid_local;

  RETURN 'APPLIED';
END;
$$;
