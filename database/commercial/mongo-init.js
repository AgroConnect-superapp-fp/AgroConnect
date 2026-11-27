// =============================================
// SCRIPT DE INICIALIZACIÓN - AgroConnect
// SGBD: MongoDB 7
// Versión: 2.0 | Fecha: Abril 2026
// Ejecutar en mongosh conectado al servidor
// =============================================

use agroconnect_nosql;

// Crea una colección solo si aún no existe para permitir ejecuciones repetibles.
function ensureCollection(name, options = {}) {
  if (!db.getCollectionNames().includes(name)) {
    db.createCollection(name, options);
    return;
  }
  if (options.validator) {
    db.runCommand({
      collMod: name,
      validator: options.validator,
      validationLevel: "strict",
      validationAction: "error"
    });
  }
}

// ----------------------------
// Colección: notificaciones
// ----------------------------
ensureCollection("notificaciones", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id_usuario", "tipo", "mensaje", "leida", "fecha"],
      properties: {
        id_usuario: { bsonType: ["long", "int"] },
        tipo: { bsonType: "string" },
        mensaje: { bsonType: "string", maxLength: 500 },
        leida: { bsonType: "bool" },
        fecha: { bsonType: "date" },
        fecha_expiracion: { bsonType: "date" }
      }
    }
  }
});
db.notificaciones.createIndex(
  { id_usuario: 1, leida: 1, fecha: -1 },
  { name: "idx_usuario_estado_fecha" }
);
db.notificaciones.createIndex(
  { fecha_expiracion: 1 },
  { expireAfterSeconds: 0, name: "ttl_expiracion" }
);

// ----------------------------
// Colección: conversaciones
// ----------------------------
ensureCollection("conversaciones", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["participantes", "ultimo_mensaje"],
      properties: {
        participantes: { bsonType: "array", minItems: 2, items: { bsonType: ["long", "int"] } },
        ultimo_mensaje: { bsonType: "date" },
        mensajes: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["uuid_local", "contenido", "fecha"],
            properties: {
              uuid_local: { bsonType: "string" },
              contenido: { bsonType: "string", maxLength: 4000 },
              fecha: { bsonType: "date" }
            }
          }
        }
      }
    }
  }
});
db.conversaciones.createIndex(
  { participantes: 1, ultimo_mensaje: -1 },
  { name: "idx_participantes_ultimo" }
);
db.conversaciones.createIndex(
  { "mensajes.uuid_local": 1 },
  { unique: true, sparse: true, name: "uk_mensaje_uuid" }
);

// H13: colección normalizada para deduplicar por conversación. El índice
// multikey anterior no puede impedir dos mensajes con el mismo uuid dentro
// del mismo arreglo; este índice compuesto sí lo hace entre documentos.
ensureCollection("mensajes", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["conversacion_id", "uuid_local", "contenido", "fecha"],
      properties: {
        conversacion_id: { bsonType: ["long", "int"] },
        uuid_local: { bsonType: "string" },
        contenido: { bsonType: "string", maxLength: 4000 },
        fecha: { bsonType: "date" }
      }
    }
  }
});
db.mensajes.createIndex(
  { conversacion_id: 1, uuid_local: 1 },
  { unique: true, name: "uk_mensaje_por_conversacion" }
);

// ----------------------------
// Colección: logs_actividad (time-series)
// ----------------------------
ensureCollection("logs_actividad", {
  timeseries: {
    timeField: "timestamp",
    metaField: "metadata",
    granularity: "hours"
  },
  expireAfterSeconds: 31536000,   // 365 días
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["timestamp", "metadata", "accion"],
      properties: {
        timestamp: { bsonType: "date" },
        metadata: {
          bsonType: "object",
          properties: {
            id_usuario: { bsonType: ["long", "int"] },
            modulo: { bsonType: "string" }
          }
        },
        accion: { bsonType: "string" },
        actor: { bsonType: "string" },
        correlacion_id: { bsonType: "string" }
      }
    }
  }
});
db.logs_actividad.createIndex(
  { "metadata.id_usuario": 1, timestamp: -1 },
  { name: "idx_usuario_tiempo" }
);
db.logs_actividad.createIndex(
  { "metadata.modulo": 1, timestamp: -1 },
  { name: "idx_modulo_tiempo" }
);

// ----------------------------
// Colección: estadisticas_agregadas
// ----------------------------
ensureCollection("estadisticas_agregadas", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["tipo_reporte", "dimensiones", "metricas", "periodo", "fecha_calculo"],
      properties: {
        tipo_reporte: { bsonType: "string" },
        dimensiones: { bsonType: "object" },
        metricas: { bsonType: "object" },
        periodo: { bsonType: "object" },
        fecha_calculo: { bsonType: "date" }
      }
    }
  }
});
db.estadisticas_agregadas.createIndex(
  { tipo_reporte: 1, "dimensiones.id_usuario": 1, "periodo.inicio": -1 },
  { name: "idx_reporte_usuario_periodo" }
);
db.estadisticas_agregadas.createIndex(
  { fecha_calculo: -1 },
  { name: "idx_fecha_calculo" }
);

// ----------------------------
// Colección: eventos_sincronizacion
// ----------------------------
ensureCollection("eventos_sincronizacion", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["uuid_local", "id_usuario", "payload", "fecha_cliente", "estado"],
      properties: {
        uuid_local: { bsonType: "string" },
        id_usuario: { bsonType: ["long", "int"] },
        payload: { bsonType: "object" },
        fecha_cliente: { bsonType: "date" },
        fecha_recepcion: { bsonType: "date" },
        estado: { enum: ["pendiente", "aplicado", "conflicto", "descartado"] },
        resolucion_conflicto: { bsonType: "object" }
      }
    }
  }
});
db.eventos_sincronizacion.createIndex(
  { uuid_local: 1 },
  { unique: true, name: "uk_uuid_local" }
);
db.eventos_sincronizacion.createIndex(
  { id_usuario: 1, estado: 1, fecha_cliente: 1 },
  { name: "idx_usuario_estado_fecha" }
);
db.eventos_sincronizacion.createIndex(
  { estado: 1, fecha_recepcion: 1 },
  { name: "idx_cola_procesamiento" }
);

// ----------------------------
// Verificación
// ----------------------------
print("Colecciones creadas:");
db.getCollectionNames().forEach(printjson);

print("Índices por colección:");
["notificaciones","conversaciones","mensajes","logs_actividad","estadisticas_agregadas","eventos_sincronizacion"]
  .forEach(c => { print("--- " + c + " ---"); db[c].getIndexes().forEach(printjson); });
