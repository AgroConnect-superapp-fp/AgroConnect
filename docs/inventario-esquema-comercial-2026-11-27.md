# INVENTARIO DEL ESQUEMA COMERCIAL OBJETIVO

**Fecha:** 27/11/2026  
**Base local:** `agroconnect_commercial` (PostgreSQL 16.4 + PostGIS 3.4.3)  
**Evidencia:** `docs/evidencias/sql/commercial-*.txt` y `docs/evidencias/mongo/commercial-mongo-2026-11-27.txt`

---

## 1. PostgreSQL

| Indicador | Resultado |
| --- | ---: |
| Tablas del modelo comercial | 24 |
| Tablas totales (incluye `spatial_ref_sys`) | 25 |
| Constraints | 96 |
| Índices | 63 |
| Políticas RLS | 14 |
| Triggers | 6 |
| Envíos por pedido | Múltiples (`envios.id_pedido` sin UNIQUE) |
| Detalle duplicado | Bloqueado por `UNIQUE (id_pedido, id_publicacion)` |
| Stock | Reserva atómica y liberación al cancelar |

Pruebas ejecutadas:

- 7 + 7 sobre stock 10: una sola reserva; la segunda falla.
- Detalle duplicado: bloqueado.
- Dos envíos para el mismo pedido: permitidos.
- Cancelación: devuelve el stock a 10 una sola vez.
- RLS: productor ve su publicación; comprador no ve publicaciones ajenas.

## 2. MongoDB

Base `agroconnect_nosql`, 6 colecciones:

- `notificaciones`
- `conversaciones`
- `mensajes`
- `logs_actividad` (time-series)
- `estadisticas_agregadas`
- `eventos_sincronizacion`

Validadores aplicados; `mensajes` tiene `UNIQUE (conversacion_id, uuid_local)`, que impide duplicados dentro de la misma conversación y permite el mismo UUID en conversaciones distintas. `logs_actividad` usa TTL de 365 días.

## 3. Límites

- El API NestJS sigue sobre Prisma/MVP; el esquema comercial está implementado como base objetivo y todavía no está conectado al API.
- H12 (sync), H15 (migración con datos) y H16 (staging/RPO/RTO) siguen pendientes.
- La validación con el auditor no está firmada.
