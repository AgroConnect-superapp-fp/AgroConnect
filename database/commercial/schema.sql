-- =============================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS RELACIONAL
-- Proyecto: AgroConnect
-- SGBD: PostgreSQL 16
-- Versión del esquema: 3.0 | Fecha de referencia: 16/05/2026
-- Autor: Equipo AgroConnect - SENA ADSO
-- =============================================

-- Crear base de datos (ejecutar conectado a 'postgres')
-- CREATE DATABASE agroconnect
--   WITH ENCODING = 'UTF8'
--        LC_COLLATE = 'es_CO.UTF-8'
--        LC_CTYPE   = 'es_CO.UTF-8'
--        TEMPLATE   = template0;

-- Conectarse previamente a la base 'agroconnect' (en pgAdmin usar Query Tool sobre ella).
-- En psql, cambiar de base con: \c agroconnect

-- Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";   -- Generación de UUID
CREATE EXTENSION IF NOT EXISTS postgis;        -- Soporte geoespacial

-- ----------------------------
-- Tipos ENUM personalizados
-- ----------------------------
CREATE TYPE estado_usuario_enum     AS ENUM ('activo','inactivo','suspendido');
CREATE TYPE estado_publicacion_enum AS ENUM ('activo','pausado','agotado','eliminado');
CREATE TYPE estado_pedido_enum      AS ENUM ('pendiente','aceptado','enviado','entregado','cancelado');
CREATE TYPE estado_envio_enum       AS ENUM ('pendiente','en_transito','entregado','fallido');
CREATE TYPE estado_ticket_enum      AS ENUM ('abierto','en_proceso','resuelto','cerrado');
CREATE TYPE tipo_movimiento_enum    AS ENUM ('entrada','salida','ajuste');

-- ----------------------------
-- Tabla: roles
-- ----------------------------
CREATE TABLE roles (
  id_rol      SERIAL PRIMARY KEY,
  nombre_rol  VARCHAR(50)  NOT NULL UNIQUE,
  descripcion VARCHAR(255)
);

-- ----------------------------
-- Tabla: usuarios
-- ----------------------------
CREATE TABLE usuarios (
  id_usuario     BIGSERIAL PRIMARY KEY,
  id_rol         INT NOT NULL REFERENCES roles(id_rol),
  nombre         VARCHAR(80)  NOT NULL,
  apellido       VARCHAR(80)  NOT NULL,
  email          VARCHAR(120) NOT NULL UNIQUE,
  contrasena     VARCHAR(255) NOT NULL,
  telefono       VARCHAR(20),
  direccion      TEXT,
  latitud        NUMERIC(9,6),
  longitud       NUMERIC(9,6),
  consentimiento_datos        BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_consentimiento        TIMESTAMPTZ,
  version_politica_aceptada   VARCHAR(10),
  consentimiento_marketing    BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_registro TIMESTAMPTZ DEFAULT NOW(),
  estado         estado_usuario_enum DEFAULT 'activo',
  CONSTRAINT chk_consentimiento CHECK (consentimiento_datos = TRUE)
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_geo   ON usuarios(latitud, longitud);

-- ----------------------------
-- Tabla: sesiones
-- ----------------------------
CREATE TABLE sesiones (
  id_sesion             BIGSERIAL PRIMARY KEY,
  id_usuario            BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  token                 VARCHAR(255) NOT NULL UNIQUE,
  dispositivo           VARCHAR(100),
  ultima_sincronizacion TIMESTAMPTZ,
  fecha_inicio          TIMESTAMPTZ DEFAULT NOW(),
  fecha_expiracion      TIMESTAMPTZ NOT NULL,
  activa                BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_sesiones_usuario ON sesiones(id_usuario, activa);

-- ----------------------------
-- Tabla: categorias
-- ----------------------------
CREATE TABLE categorias (
  id_categoria     SERIAL PRIMARY KEY,
  nombre_categoria VARCHAR(100) NOT NULL,
  descripcion      TEXT,
  icono            VARCHAR(100)
);

-- ----------------------------
-- Tabla: productos
-- ----------------------------
CREATE TABLE productos (
  id_producto   BIGSERIAL PRIMARY KEY,
  id_categoria  INT NOT NULL REFERENCES categorias(id_categoria),
  nombre        VARCHAR(100) NOT NULL,
  descripcion   TEXT,
  unidad_medida VARCHAR(30) NOT NULL,
  metadatos     JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_productos_categoria ON productos(id_categoria);
CREATE INDEX idx_productos_metadatos ON productos USING GIN (metadatos);

-- ----------------------------
-- Tabla: publicaciones
-- ----------------------------
CREATE TABLE publicaciones (
  id_publicacion      BIGSERIAL PRIMARY KEY,
  id_usuario          BIGINT NOT NULL REFERENCES usuarios(id_usuario),
  id_producto         BIGINT NOT NULL REFERENCES productos(id_producto),
  precio              NUMERIC(12,2) NOT NULL CHECK (precio >= 0),
  cantidad_disponible NUMERIC(10,2) NOT NULL,
  descripcion         TEXT,
  imagen_url          VARCHAR(500),
  estado              estado_publicacion_enum DEFAULT 'activo',
  fecha_publicacion   TIMESTAMPTZ DEFAULT NOW(),
  uuid_local          UUID UNIQUE
);

CREATE INDEX idx_publicaciones_usuario ON publicaciones(id_usuario);
CREATE INDEX idx_publicaciones_estado  ON publicaciones(estado) WHERE estado = 'activo';

-- ----------------------------
-- Tabla: inventario
-- ----------------------------
CREATE TABLE inventario (
  id_inventario       BIGSERIAL PRIMARY KEY,
  id_usuario          BIGINT NOT NULL REFERENCES usuarios(id_usuario),
  id_producto         BIGINT NOT NULL REFERENCES productos(id_producto),
  stock_actual        NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_minimo        NUMERIC(10,2) NOT NULL DEFAULT 0,
  fecha_actualizacion TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (id_usuario, id_producto)
);

-- Trigger para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION fn_actualizar_fecha_inventario()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tg_inventario_fecha
BEFORE UPDATE ON inventario
FOR EACH ROW EXECUTE FUNCTION fn_actualizar_fecha_inventario();

-- ----------------------------
-- Tabla: movimientos_inventario
-- ----------------------------
CREATE TABLE movimientos_inventario (
  id_movimiento BIGSERIAL PRIMARY KEY,
  id_inventario BIGINT NOT NULL REFERENCES inventario(id_inventario),
  tipo          tipo_movimiento_enum NOT NULL,
  cantidad      NUMERIC(10,2) NOT NULL,
  descripcion   VARCHAR(255),
  origen        VARCHAR(20) DEFAULT 'servidor' CHECK (origen IN ('servidor','local')),
  uuid_local    UUID UNIQUE,
  fecha         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_movimientos_inv ON movimientos_inventario(id_inventario, fecha DESC);

-- ----------------------------
-- Tabla: pedidos
-- ----------------------------
CREATE TABLE pedidos (
  id_pedido         BIGSERIAL PRIMARY KEY,
  id_comprador      BIGINT NOT NULL REFERENCES usuarios(id_usuario),
  codigo_pedido     VARCHAR(20) NOT NULL UNIQUE,
  fecha_pedido      TIMESTAMPTZ DEFAULT NOW(),
  estado            estado_pedido_enum DEFAULT 'pendiente',
  total             NUMERIC(14,2) DEFAULT 0,
  direccion_entrega TEXT,
  uuid_local        UUID UNIQUE
);

CREATE INDEX idx_pedidos_comprador ON pedidos(id_comprador, fecha_pedido DESC);
CREATE INDEX idx_pedidos_estado    ON pedidos(estado);

-- ----------------------------
-- Tabla: detalle_pedido
-- ----------------------------
CREATE TABLE detalle_pedido (
  id_detalle      BIGSERIAL PRIMARY KEY,
  id_pedido       BIGINT NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
  id_publicacion  BIGINT NOT NULL REFERENCES publicaciones(id_publicacion),
  cantidad        NUMERIC(10,2) NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(12,2) NOT NULL,
  subtotal        NUMERIC(14,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  stock_liberado  BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_detalle_pedido_publicacion UNIQUE (id_pedido, id_publicacion)
);

CREATE INDEX idx_detalle_pedido ON detalle_pedido(id_pedido);

-- ----------------------------
-- Tabla: transportistas
-- ----------------------------
CREATE TABLE transportistas (
  id_transportista BIGSERIAL PRIMARY KEY,
  id_usuario       BIGINT NOT NULL UNIQUE REFERENCES usuarios(id_usuario),
  vehiculo         VARCHAR(80),
  capacidad_kg     NUMERIC(10,2),
  zona_cobertura   JSONB DEFAULT '{}'::jsonb,
  disponibilidad   BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_transportistas_zona ON transportistas USING GIN (zona_cobertura);

-- ----------------------------
-- Tabla: envios
-- ----------------------------
CREATE TABLE envios (
  id_envio           BIGSERIAL PRIMARY KEY,
  id_pedido          BIGINT NOT NULL REFERENCES pedidos(id_pedido),
  id_transportista   BIGINT REFERENCES transportistas(id_transportista),
  estado             estado_envio_enum DEFAULT 'pendiente',
  fecha_envio        TIMESTAMPTZ,
  fecha_entrega_est  DATE,
  fecha_entrega_real TIMESTAMPTZ,
  observaciones      TEXT
);

CREATE INDEX idx_envios_pedido ON envios(id_pedido);

-- ----------------------------
-- Tabla: calificaciones
-- ----------------------------
CREATE TABLE calificaciones (
  id_calificacion BIGSERIAL PRIMARY KEY,
  id_pedido       BIGINT NOT NULL REFERENCES pedidos(id_pedido),
  id_calificador  BIGINT NOT NULL REFERENCES usuarios(id_usuario),
  id_calificado   BIGINT NOT NULL REFERENCES usuarios(id_usuario),
  puntuacion      SMALLINT NOT NULL CHECK (puntuacion BETWEEN 1 AND 5),
  comentario      TEXT,
  fecha           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (id_pedido, id_calificador, id_calificado)
);

CREATE INDEX idx_calif_calificado ON calificaciones(id_calificado);

-- ----------------------------
-- Tabla: tickets_soporte
-- ----------------------------
CREATE TABLE tickets_soporte (
  id_ticket      BIGSERIAL PRIMARY KEY,
  id_usuario     BIGINT NOT NULL REFERENCES usuarios(id_usuario),
  titulo         VARCHAR(200) NOT NULL,
  descripcion    TEXT NOT NULL,
  estado         estado_ticket_enum DEFAULT 'abierto',
  fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_cierre   TIMESTAMPTZ
);

CREATE INDEX idx_tickets_estado ON tickets_soporte(estado, fecha_creacion DESC);

-- ----------------------------
-- Tabla: respuestas_ticket
-- ----------------------------
CREATE TABLE respuestas_ticket (
  id_respuesta BIGSERIAL PRIMARY KEY,
  id_ticket    BIGINT NOT NULL REFERENCES tickets_soporte(id_ticket) ON DELETE CASCADE,
  id_usuario   BIGINT NOT NULL REFERENCES usuarios(id_usuario),
  contenido    TEXT NOT NULL,
  fecha        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resp_ticket ON respuestas_ticket(id_ticket, fecha);

-- ----------------------------
-- Tablas de expansión: M14, M15, M16 y M17
-- ----------------------------
CREATE TABLE eventos_canal_alterno (
  id_evento       BIGSERIAL PRIMARY KEY,
  id_usuario      BIGINT NOT NULL REFERENCES usuarios(id_usuario),
  canal           VARCHAR(10) NOT NULL CHECK (canal IN ('SMS','USSD')),
  numero_origen  VARCHAR(20) NOT NULL,
  comando         VARCHAR(50) NOT NULL,
  payload         TEXT,
  estado          VARCHAR(20) NOT NULL DEFAULT 'recibido' CHECK (estado IN ('recibido','procesado','fallido','respondido')),
  fecha_recepcion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  operador_telco  VARCHAR(50)
);

CREATE INDEX idx_eventos_canal_usuario ON eventos_canal_alterno(id_usuario, fecha_recepcion DESC);

CREATE TABLE mensajes_ussd (
  id_mensaje        BIGSERIAL PRIMARY KEY,
  id_evento         BIGINT NOT NULL REFERENCES eventos_canal_alterno(id_evento) ON DELETE CASCADE,
  codigo_servicio   VARCHAR(20) NOT NULL,
  nivel_menu        SMALLINT NOT NULL DEFAULT 1 CHECK (nivel_menu > 0),
  parametros        JSONB,
  respuesta_enviada TEXT,
  sesion_id         VARCHAR(50) NOT NULL,
  fecha             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mensajes_ussd_evento ON mensajes_ussd(id_evento, fecha DESC);

CREATE TABLE transacciones_pago (
  id_transaccion       BIGSERIAL PRIMARY KEY,
  id_pedido            BIGINT NOT NULL REFERENCES pedidos(id_pedido),
  metodo_pago          VARCHAR(30) NOT NULL CHECK (metodo_pago IN ('PSE','Nequi','Daviplata','Efectivo_Efecty','Efectivo_SuRed','Tarjeta')),
  monto                NUMERIC(14,2) NOT NULL CHECK (monto > 0),
  referencia_pasarela  VARCHAR(100),
  estado_transaccion   VARCHAR(30) NOT NULL DEFAULT 'iniciada' CHECK (estado_transaccion IN ('iniciada','pendiente','aprobada','rechazada','reversada')),
  fecha_iniciacion     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_confirmacion   TIMESTAMPTZ,
  metadatos_pasarela   JSONB,
  uuid_local           UUID UNIQUE
);

CREATE INDEX idx_transacciones_pago_pedido ON transacciones_pago(id_pedido, fecha_iniciacion DESC);

CREATE TABLE conciliaciones_dian (
  id_conciliacion BIGSERIAL PRIMARY KEY,
  id_transaccion  BIGINT NOT NULL UNIQUE REFERENCES transacciones_pago(id_transaccion),
  cufe            VARCHAR(96) NOT NULL UNIQUE,
  numero_factura  VARCHAR(50) NOT NULL UNIQUE,
  nit_emisor      VARCHAR(20) NOT NULL,
  nit_receptor    VARCHAR(20),
  estado_dian     VARCHAR(30) NOT NULL DEFAULT 'pendiente' CHECK (estado_dian IN ('pendiente','aceptada','rechazada','anulada')),
  fecha_emision   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  xml_factura     TEXT
);

CREATE TABLE zonas_cobertura (
  id_zona                BIGSERIAL PRIMARY KEY,
  id_transportista       BIGINT NOT NULL REFERENCES transportistas(id_transportista),
  nombre_zona            VARCHAR(150) NOT NULL,
  departamento           VARCHAR(80) NOT NULL,
  municipios             TEXT[],
  poligono_cobertura     GEOGRAPHY(POLYGON, 4326),
  radio_km               NUMERIC(6,2),
  condiciones_especiales TEXT,
  activa                 BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX idx_zonas_cobertura_geo ON zonas_cobertura USING GIST (poligono_cobertura);

CREATE TABLE rutas_geolocalizadas (
  id_ruta                 BIGSERIAL PRIMARY KEY,
  id_envio                BIGINT NOT NULL REFERENCES envios(id_envio),
  origen                  GEOGRAPHY(POINT, 4326) NOT NULL,
  destino                 GEOGRAPHY(POINT, 4326) NOT NULL,
  waypoints               GEOGRAPHY(LINESTRING, 4326),
  distancia_km            NUMERIC(8,2),
  tiempo_estimado_min     NUMERIC(6,0),
  estado_ruta             VARCHAR(20) NOT NULL DEFAULT 'planificada' CHECK (estado_ruta IN ('planificada','en_curso','completada','desviada')),
  fecha_inicio_real       TIMESTAMPTZ,
  fecha_finalizacion_real TIMESTAMPTZ
);

CREATE TABLE lotes_perecederos (
  id_lote              BIGSERIAL PRIMARY KEY,
  id_publicacion       BIGINT NOT NULL REFERENCES publicaciones(id_publicacion),
  codigo_lote          VARCHAR(30) NOT NULL UNIQUE,
  fecha_cosecha        DATE NOT NULL,
  fecha_vencimiento    DATE NOT NULL CHECK (fecha_vencimiento > fecha_cosecha),
  vida_util_dias       SMALLINT NOT NULL CHECK (vida_util_dias > 0),
  requiere_cadena_frio BOOLEAN NOT NULL DEFAULT FALSE,
  temperatura_min      NUMERIC(4,1),
  temperatura_max      NUMERIC(4,1),
  registro_ica         VARCHAR(50),
  cantidad_inicial     NUMERIC(10,2) NOT NULL CHECK (cantidad_inicial >= 0),
  cantidad_disponible  NUMERIC(10,2) NOT NULL CHECK (cantidad_disponible >= 0)
);

CREATE TABLE registros_cadena_frio (
  id_registro            BIGSERIAL PRIMARY KEY,
  id_lote                BIGINT NOT NULL REFERENCES lotes_perecederos(id_lote) ON DELETE CASCADE,
  id_envio               BIGINT REFERENCES envios(id_envio),
  temperatura_celsius    NUMERIC(4,1) NOT NULL,
  humedad_relativa       NUMERIC(5,2) CHECK (humedad_relativa BETWEEN 0 AND 100),
  en_rango               BOOLEAN NOT NULL,
  incidencia_detectada   BOOLEAN NOT NULL DEFAULT FALSE,
  descripcion_incidencia TEXT,
  ubicacion              GEOGRAPHY(POINT, 4326),
  fecha_registro         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cadena_frio_lote_fecha ON registros_cadena_frio(id_lote, fecha_registro DESC);

CREATE TABLE alertas_vencimiento (
  id_alerta             BIGSERIAL PRIMARY KEY,
  id_lote               BIGINT NOT NULL REFERENCES lotes_perecederos(id_lote) ON DELETE CASCADE,
  tipo_alerta           VARCHAR(20) NOT NULL CHECK (tipo_alerta IN ('72h','48h','24h','vencido')),
  fecha_alerta          TIMESTAMPTZ NOT NULL,
  notificada_productor  BOOLEAN NOT NULL DEFAULT FALSE,
  accion_tomada         VARCHAR(50),
  fecha_accion          TIMESTAMPTZ
);

CREATE INDEX idx_alertas_vencimiento_lote ON alertas_vencimiento(id_lote, fecha_alerta DESC);

-- ----------------------------
-- Datos iniciales: roles (5 roles oficiales del sistema + Soporte como sub-rol)
-- Alineados con PT-IGS-01 v2.0 sección 8 y PT-MU-01 v1.0.1 sección 5.1
-- ----------------------------
INSERT INTO roles (nombre_rol, descripcion) VALUES
  ('Administrador',      'Control total del sistema, moderación de contenidos y soporte operativo'),
  ('Productor',          'Gestión de productos, inventario y publicaciones agrícolas'),
  ('Comprador B2C',      'Consumidor final que adquiere productos para uso personal o familiar'),
  ('Comprador B2B',      'Empresa, restaurante, fruver, supermercado o agroindustria que adquiere al por mayor'),
  ('Operador Logístico', 'Empresa de transporte, cooperativa rural, mensajero independiente u operador especializado en cadena de frío'),
  ('Soporte',            'Sub-rol del Administrador para atención de incidencias y PQR (sin acceso a datos financieros sensibles)');

-- ----------------------------
-- Datos iniciales: categorías (contexto agrícola colombiano)
-- ----------------------------
INSERT INTO categorias (nombre_categoria, descripcion, icono) VALUES
  ('Hortalizas',   'Verduras y vegetales de consumo fresco',                'hortalizas.svg'),
  ('Frutas',       'Frutas tropicales y de clima frío',                     'frutas.svg'),
  ('Cereales',     'Maíz, arroz, trigo, cebada y derivados',                'cereales.svg'),
  ('Café',         'Café verde, pergamino y tostado',                       'cafe.svg'),
  ('Lácteos',      'Leche, queso, cuajada y derivados',                     'lacteos.svg'),
  ('Tubérculos',   'Papa, yuca, ñame, arracacha y similares',               'tuberculos.svg'),
  ('Plátano',      'Plátano verde, hartón, dominico y banano',              'platano.svg'),
  ('Panela',       'Panela en bloque, cuadrada, granulada y derivados',     'panela.svg');

-- H11: índices para consultas comerciales prioritarias.
CREATE INDEX IF NOT EXISTS idx_publicaciones_actor_estado_fecha
  ON publicaciones(id_usuario, estado, fecha_publicacion DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_comprador_estado_fecha
  ON pedidos(id_comprador, estado, fecha_pedido DESC);
CREATE INDEX IF NOT EXISTS idx_lotes_publicacion
  ON lotes_perecederos(id_publicacion);
CREATE INDEX IF NOT EXISTS idx_detalle_publicacion
  ON detalle_pedido(id_publicacion);
CREATE INDEX IF NOT EXISTS idx_lotes_publicacion_vencimiento
  ON lotes_perecederos(id_publicacion, fecha_vencimiento);
