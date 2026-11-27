# ANEXO PT-MCBD-01 v3.1 — ALCANCE, CORRECCIONES Y EVIDENCIAS

> **Estado:** borrador local para incorporar en Notion.  
> **Motivo:** la página oficial PT-MCBD-01 no está compartida con la integración de Notion (respuesta 404).  
> **Acción requerida:** compartir la página con la integración o pegar este anexo en la versión v3.1.

---

## 1. Aviso de alcance

Este manual describe **dos capas distintas**:

| Capa | Qué incluye | Cómo debe leerse |
| --- | --- | --- |
| MVP implementado | Identidad, perfiles, marketplace, parcelas, moderación, geoespacial, administración de usuarios | Estado real, con evidencia en repositorio |
| Diseño objetivo | 24 tablas, RLS, pedidos, stock, envíos, MongoDB, offline, backups avanzados | Diseño planificado; no implementado en el MVP |
| Backlog | M04, M05, M06, M07, M08, M09, M11, M12, M13, M14, M15, M17 | Roadmap; no evidencia de aceptación |

**Regla editorial:** ninguna sección del manual puede usar “implementado”, “operativo” o “validado” para un elemento de la capa de diseño objetivo.

---

## 2. Corrección H02 — R19 y R21

### R19 — Cobertura

**Texto anterior:** usuarios como origen de `zonas_cobertura`.

**Corrección propuesta:**

- Entidad origen: `transportistas` (perfil del usuario con rol transportista).
- Relación: `transportistas 1:N zonas_cobertura`.
- Clave foránea: `zonas_cobertura.transportista_id → transportistas.id`.
- Ruta indirecta: `usuarios 1:1 transportistas 1:N zonas_cobertura`.
- El MER debe dibujar la ruta indirecta con línea punteada y no como FK directa de `usuarios`.

### R21 — Lotes perecederos

**Texto anterior:** productos como origen de `lotes_perecederos`.

**Corrección propuesta:**

- Entidad origen: `publicaciones`.
- Relación: `publicaciones 1:N lotes_perecederos`.
- Clave foránea: `lotes_perecederos.publicacion_id → publicaciones.id`.
- Ruta indirecta: `productos 1:N publicaciones 1:N lotes_perecederos`.
- El MER debe diferenciar producto (catálogo) de publicación (oferta concreta).

**Criterio de cierre:** R19/R21 coinciden con el diccionario, la FK y los requisitos M16/M17. Las rutas indirectas se identifican y no se confunden con claves foráneas.

---

## 3. Corrección H04 — Diccionario conceptual/físico

| Concepto | Nombre físico actual | Tabla | Observación |
| --- | --- | --- | --- |
| Ubicación de finca | `coordenadas geography(Point, 4326)` | `producer_profiles` | Punto PostGIS; no `latitud/longitud` separadas |
| Ubicación de producto | `lat`, `lng` | `products` | Campos numéricos para el marketplace |
| Geometría de parcela | `geom geometry(Polygon,4326)` | `plots` | Fuente de verdad de la geometría |
| Centroide de parcela | `centroid geography(Point,4326)` | `plots` | Derivado por trigger PostGIS |
| Consentimiento | `acepta_tratamiento_datos` | `users` | Booleano obligatorio |
| Verificación de correo | `correo_verificado_en` | `users` | Fecha nullable |

**Regla:** el diccionario debe mostrar el nombre conceptual, el nombre físico y la migración que lo introduce. Los cambios de consentimiento no se describen como un `ALTER` aislado: forman parte del orden de instalación.

---

## 4. Corrección H03 — Matriz de ambientes

Incluir la tabla de `docs/matriz-ambientes-datos.md`:

- PostgreSQL 16.4, PostGIS 3.4.3, UTF8, `en_US.utf8`, `Etc/UTC` en local/test.
- Staging y producción: “por verificar” hasta contar con evidencia.
- Instalación limpia: 12 migraciones y extensión PostGIS.

**Criterio de cierre:** una instalación limpia demuestra versión, extensiones, timezone y collation; la ficha se firma.

---

## 5. Corrección H05 — RLS

El manual no debe afirmar que el MVP tiene RLS.

- **MVP:** autorización en la API (`SessionAuthGuard`, `RolesGuard`, casos de uso).
- **Modelo comercial:** RLS obligatorio antes de aceptar pedidos, stock, lotes, pagos y cobertura.
- **Rol de aplicación:** mínimo privilegio, sin superusuario ni DDL.
- **TLS:** obligatorio en staging/producción.

Ver `docs/adr/0027-control-acceso-datos-rls-mvp.md`.

---

## 6. Exclusiones temporales

| Hallazgo | Estado | Condición |
| --- | --- | --- |
| H07 | Excluido del MVP | Diseño objetivo; unidad de despacho por decidir |
| H08 | Excluido del MVP | Diseño objetivo; regla de detalle por decidir |
| H09 | Excluido del MVP | Diseño objetivo; reserva atómica al implementar inventario |
| H12 | Excluido del MVP | Diseño objetivo; versionado/LWW al implementar M14 |
| H13 | Excluido del MVP | MongoDB fuera del MVP; reevaluar si es requisito académico |
| H15 offline | Excluido del MVP | SQLite/IndexedDB fuera del MVP |

**H05 no se excluye:** se documenta como control objetivo y se mantiene abierto.

---

## 7. Hallazgos que permanecen en el MVP

H01, H02, H03, H04, H06, H10, H11, H14, H15 (migraciones actuales) y H16.

Evidencia base:

- 10 modelos Prisma, 12 migraciones.
- 27 restricciones, 40 índices, 0 RLS.
- 456 pruebas API, 155 frontend, 18 E2E.
- `docs/evidencias/sql/inventario-2026-11-26-*.txt`.

---

## 8. Historial de revisión

| Versión | Fecha | Cambio | Responsable |
| --- | --- | --- | --- |
| 3.0 | 27/10/2026 | Corte auditado | Equipo AgroConnect |
| 3.1 | 26/11/2026 | Anexo de alcance, R19/R21, diccionario, ambientes, RLS y exclusiones | Arquitectura / Datos |

---

## 9. Cambios respecto a la versión anterior

1. Se separa MVP de diseño objetivo y backlog.
2. Se corrigen R19 y R21.
3. Se publica el mapeo conceptual/físico.
4. Se declara que el MVP no tiene RLS.
5. Se excluyen formalmente los módulos no implementados (pendiente de firma).
6. Se agrega la matriz de ambientes y el inventario real.
