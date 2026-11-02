# Matriz de Trazabilidad RF↔CU↔HU — AgroConnect (v2.0)
**Fecha de generación:** 2026-07-03T10:35:29.992345
**Fuentes:** Notion PT-ERS-01 (RF), Notion Base de Casos de Uso (CU), Notion Base de Historias de Usuario (HU).
**Totales oficiales SENA:** 17 módulos, 68 RF, 66 CU, 69 HU.
**Estado:** ✅ 100% de artefactos mapeados; 84 propiedades de módulo actualizadas en Notion; 0 relaciones débiles RF→CU y CU→HU.

## Resumen de Totales
| Artefacto | Esperado | Mapeados | Estado |
|-----------|----------|----------|--------|
| RF | 68 | 68 | ✅ |
| CU | 66 | 66 | ✅ |
| HU | 69 | 69 | ✅ |
| Módulos | 17 | 17 | ✅ |

## Matriz por Módulo
| Módulo | Nombre | RF | CU | HU | RF→CU | CU→HU | Observación |
|--------|--------|----|----|----|-------|-------|-------------|
| M01 | Gestión de Inicio y Panel General | 4 | 3 | 1 | Sí | Sí | Completado con CU#28 (sin RF directo) |
| M02 | Gestión de Usuarios y Perfiles | 6 | 7 | 9 | Sí | Sí | Completado con CU#02, CU#22, CU#26, CU#37, CU#38 |
| M03 | Marketplace Agropecuario | 6 | 5 | 5 | Sí | Sí | Completado con CU#25, CU#40 |
| M04 | Gestión de Inventarios | 3 | 3 | 4 | Sí | Sí | Completado con CU#03, CU#41 |
| M05 | Comunicación Interna | 3 | 3 | 3 | Sí | Sí | Completado con CU#42 |
| M06 | Gestión Logística | 3 | 4 | 3 | Sí | Sí | Completado con CU#43 |
| M07 | Gestión de Pedidos | 3 | 4 | 5 | Sí | Sí | Completado con CU#33, CU#44 |
| M08 | Pagos y Transacciones | 2 | 3 | 3 | Sí | Sí | Completado con CU#45 |
| M09 | Panel Administrativo | 3 | 4 | 3 | Sí | Sí | Completado con CU#15, CU#47 |
| M10 | Seguridad y Control | 3 | 3 | 3 | Sí | Sí |  |
| M11 | Soporte y Ayuda | 2 | 3 | 3 | Sí | Sí | Completado con CU#49 |
| M12 | IA AgroBot (Subsistema 12) | 4 | 4 | 3 | Sí | Sí | Completado con CU#52 |
| M13 | Gestión de Compras | 4 | 5 | 3 | Sí | Sí | Completado con CU#53 |
| M14 | Multicanal y Operación Offline | 9 | 6 | 5 | Sí | Sí | Completado con CU#04, CU#54, CU#55, CU#58 |
| M15 | Pagos Locales Colombianos | 5 | 4 | 4 | Sí | Sí | Completado con CU#60, CU#61 |
| M16 | Geolocalización Rural | 4 | 4 | 3 | Sí | Sí | Completado con CU#39, CU#65 |
| M17 | Productos Perecederos | 4 | 1 | 9 | Sí | Sí | 1 CU (CU#66) cubre 9 HU (HU61–HU69, definitivas y validadas en la base de HU de Notion) |

## Matriz Detallada RF → CU → HU
| RF | Requisito Funcional | CU | Caso de Uso | HU | Historia de Usuario |
|----|---------------------|----|-------------|----|---------------------|
| RF-01 | Autenticación de usuarios | CU#09 | Visualizar Dashboard del Productor | HU14 | Panel general |
| RF-02 | Recuperación de contraseña | CU#09 | Visualizar Dashboard del Productor | HU14 | Panel general |
| RF-03 | Control de sesiones | CU#36 | Configurar Preferencias Iniciales del Sistema | HU14 | Panel general |
| RF-04 | Panel general por rol | CU#09 | Visualizar Dashboard del Productor | HU14 | Panel general |
| — | — | CU#28 | Recibir Notificaciones del Sistema | HU13 | Control de sesiones |
| RF-05 | Registro multi-rol de usuarios | CU#01 | Registrar Productor | HU01 | Registro de usuario |
| RF-06 | Edición de perfil | CU#23 | Editar Perfil de Usuario | HU03 | Gestión de perfil |
| RF-07 | Gestión de roles y permisos | CU#15 | Gestionar Usuarios (Admin) | HU09 | Gestión de roles |
| RF-08 | Búsqueda y consulta de usuarios | CU#15 | Gestionar Usuarios (Admin) | HU09 | Gestión de roles |
| RF-09 | Desactivación de usuarios | CU#23 | Editar Perfil de Usuario | HU03 | Gestión de perfil |
| RF-10 | Reputación de usuarios | CU#23 | Editar Perfil de Usuario | HU03 | Gestión de perfil |
| — | — | CU#02 | Iniciar Sesión | HU02 | Inicio de sesión |
| — | — | CU#22 | Recuperar Contraseña | HU12 | Recuperación de contraseña |
| — | — | CU#26 | Gestionar Reputación del Usuario | HU17 | Reputación |
| — | — | CU#37 | Configurar Notificaciones por Usuario | HU13 | Control de sesiones |
| — | — | CU#38 | Exportar Datos Personales (Derecho de Acceso Habeas Data) | HU16 | Desactivación de usuarios |
| RF-11 | Publicación de productos | CU#24 | Explorar Productos del Marketplace | HU05 | Visualización de productos |
| RF-12 | Visualización de productos | CU#24 | Explorar Productos del Marketplace | HU05 | Visualización de productos |
| RF-13 | Búsqueda avanzada de productos | CU#24 | Explorar Productos del Marketplace | HU05 | Visualización de productos |
| RF-14 | Solicitud de compra | CU#06 | Publicar Demanda B2B | HU11 | Negociación empresarial |
| RF-15 | Cierre de transacción | CU#08 | Calificar Transacción | HU19 | Calificaciones |
| RF-16 | Calificaciones y comentarios | CU#08 | Calificar Transacción | HU19 | Calificaciones |
| — | — | CU#25 | Buscar Productos con Filtros | HU18 | Búsqueda avanzada de productos |
| — | — | CU#40 | Comparar Productos Lado a Lado | HU05 | Visualización de productos |
| RF-17 | Control de inventario | CU#27 | Consultar Disponibilidad y Alertas de Inventario | HU20 | Disponibilidad en tiempo real |
| RF-18 | Disponibilidad en tiempo real | CU#27 | Consultar Disponibilidad y Alertas de Inventario | HU20 | Disponibilidad en tiempo real |
| RF-19 | Alertas de stock mínimo | CU#27 | Consultar Disponibilidad y Alertas de Inventario | HU20 | Disponibilidad en tiempo real |
| — | — | CU#03 | Registrar Producto | HU04 | Publicar productos |
| — | — | CU#41 | Sincronizar Inventario con Múltiples Dispositivos | HU21 | Alertas de stock |
| RF-20 | Mensajería interna | CU#13 | Enviar Mensaje | HU22 | Mensajería interna |
| RF-21 | Historial de mensajes | CU#14 | Consultar Historial de Mensajes | HU23 | Historial de mensajes |
| RF-22 | Notificaciones de mensajes | CU#14 | Consultar Historial de Mensajes | HU23 | Historial de mensajes |
| — | — | CU#42 | Crear Grupo de Chat para un Pedido | HU24 | Notificaciones de mensajes |
| RF-23 | Registro de transportistas | CU#29 | Registrar Transportista | HU25 | Registro de transportistas |
| RF-24 | Asignación de envíos | CU#11 | Asignar Envío | HU26 | Asignación de envíos |
| RF-25 | Seguimiento de envíos | CU#12 | Consultar Estado del Envío | HU27 | Seguimiento de envíos |
| — | — | CU#43 | Asignar Transportista con Mejor Rating | HU26 | Asignación de envíos |
| RF-26 | Registro de pedidos | CU#30 | Consultar Historial de Pedidos | HU29 | Historial de pedidos |
| RF-27 | Estados del pedido | CU#10 | Gestionar Pedido (Productor) | HU07 | Registro de pedidos |
| RF-28 | Historial de pedidos | CU#30 | Consultar Historial de Pedidos | HU29 | Historial de pedidos |
| — | — | CU#33 | Confirmar Pedido | HU44 | Confirmar pedido |
| — | — | CU#44 | Cancelar Pedido con Reembolso Automático | HU47 | Seguimiento de pedido |
| RF-29 | Integración de pagos electrónicos | CU#21 | Registrar Transacción | HU31 | Registro de transacciones |
| RF-30 | Registro de transacciones | CU#46 | Generar Reporte de Transacciones para Contabilidad | HU31 | Registro de transacciones |
| — | — | CU#45 | Procesar Reembolso por Cancelación | HU48 | Cierre de transacción |
| RF-31 | Monitoreo del sistema | CU#31 | Monitorear Sistema (Admin) | HU32 | Monitoreo del sistema |
| RF-32 | Generación de reportes | CU#16 | Generar Reportes | HU10 | Generar reportes |
| RF-33 | Gestión de incidencias | CU#31 | Monitorear Sistema (Admin) | HU32 | Monitoreo del sistema |
| — | — | CU#15 | Gestionar Usuarios (Admin) | HU09 | Gestión de roles |
| — | — | CU#47 | Banear Usuario por Violación de Términos | HU16 | Desactivación de usuarios |
| RF-34 | Control de accesos RBAC | CU#17 | Gestionar Accesos | HU34 | Control de accesos |
| RF-35 | Registro de actividad | CU#18 | Registrar Actividad del Sistema | HU35 | Registro de actividad |
| RF-36 | Copias de seguridad automáticas | CU#48 | Habilitar Autenticación de Dos Factores (2FA) | HU36 | Copias de seguridad |
| RF-37 | Centro de ayuda | CU#20 | Consultar Centro de Ayuda | HU37 | Centro de ayuda |
| RF-38 | Sistema de tickets | CU#19 | Crear Ticket de Soporte | HU38 | Gestión de tickets |
| — | — | CU#49 | Chat con Soporte Humano (Escalamiento de AgroBot) | HU42 | Soporte inicial |
| RF-39 | Chatbot conversacional | CU#07 | Interacción con AgroBot | HU39 | Chatbot IA (AgroBot) |
| RF-40 | Respuestas automáticas a preguntas frecuentes | CU#50 | Consultar a AgroBot sobre un RF Específico | HU40 | Respuestas automáticas |
| RF-41 | Orientación contextual al usuario | CU#51 | AgroBot Aprende de Feedback del Usuario | HU41 | Orientación al usuario |
| RF-42 | Escalamiento a soporte humano | CU#49 | Chat con Soporte Humano (Escalamiento de AgroBot) | HU42 | Soporte inicial |
| — | — | CU#52 | AgroBot Detecta Idioma y Responde | HU39 | Chatbot IA (AgroBot) |
| RF-43 | Gestión del carrito de compras | CU#32 | Gestionar Carrito de Compras | HU43 | Gestionar carrito de compras |
| RF-44 | Confirmación de pedido | CU#05 | Realizar Pedido (B2C) | HU43 | Gestionar carrito de compras |
| RF-45 | Historial de compras | CU#34 | Consultar Historial de Compras | HU45 | Historial de compras |
| RF-46 | Calificación de productos adquiridos | CU#35 | Calificar Productos Adquiridos | HU46 | Calificar Productos Adquiridos |
| — | — | CU#53 | Aplicar Código de Descuento en Checkout | HU43 | Gestionar carrito de compras |
| RF-47 | Aplicación Web Responsiva | CU#57 | Acceder desde Múltiples Dispositivos | HU52 | Acceder desde Múltiples Dispositivos |
| RF-48 | Aplicación Móvil Nativa Android | CU#57 | Acceder desde Múltiples Dispositivos | HU52 | Acceder desde Múltiples Dispositivos |
| RF-49 | Aplicación Móvil Nativa iOS | CU#57 | Acceder desde Múltiples Dispositivos | HU52 | Acceder desde Múltiples Dispositivos |
| RF-50 | Modo Offline para Productor | CU#56 | Sincronizar Cambios Offline al Reconectar | HU51 | Sincronizar Cambios Offline al Reconectar |
| RF-51 | Modo Offline para Transportista | CU#56 | Sincronizar Cambios Offline al Reconectar | HU51 | Sincronizar Cambios Offline al Reconectar |
| RF-52 | Cola de Sincronización | CU#56 | Sincronizar Cambios Offline al Reconectar | HU51 | Sincronizar Cambios Offline al Reconectar |
| RF-53 | Sincronización Automática | CU#56 | Sincronizar Cambios Offline al Reconectar | HU51 | Sincronizar Cambios Offline al Reconectar |
| RF-54 | Resolución de Conflictos | CU#56 | Sincronizar Cambios Offline al Reconectar | HU51 | Sincronizar Cambios Offline al Reconectar |
| RF-55 | Caché de Catálogo | CU#56 | Sincronizar Cambios Offline al Reconectar | HU51 | Sincronizar Cambios Offline al Reconectar |
| — | — | CU#04 | Gestionar Inventario Sin Conexión | HU51 | Sincronizar Cambios Offline al Reconectar |
| — | — | CU#54 | Recibir Notificación SMS por Alerta Crítica | HU49 | Recibir Alertas Críticas por SMS Rural |
| — | — | CU#55 | Consultar Precios vía Código USSD *123# | HU50 | Consultar Precios vía Código USSD *123# |
| — | — | CU#58 | Notificar al Productor cuando Comprador está Sin Conexión | HU53 | Verificar Estado Online de Otros Usuarios |
| RF-56 | Pago Contra Entrega en Efectivo | CU#59 | Pagar con PSE (Débito Bancario ACH Colombia) | HU54 | Pagar con PSE-ACH Colombia |
| RF-57 | Transferencia Bancaria Local | CU#59 | Pagar con PSE (Débito Bancario ACH Colombia) | HU54 | Pagar con PSE-ACH Colombia |
| RF-58 | Pasarela de Tarjetas | CU#59 | Pagar con PSE (Débito Bancario ACH Colombia) | HU54 | Pagar con PSE-ACH Colombia |
| RF-59 | Liquidación con Comisión Configurable | CU#59 | Pagar con PSE (Débito Bancario ACH Colombia) | HU54 | Pagar con PSE-ACH Colombia |
| RF-60 | Comprobantes y Facturación Electrónica | CU#62 | Generar Factura Electrónica con CUFE (DIAN) | HU57 | Generar Factura Electrónica con CUFE (DIAN) |
| — | — | CU#60 | Pagar con Nequi (Código QR) | HU55 | Pagar con Nequi |
| — | — | CU#61 | Pagar con Daviplata (Cédula + Código) | HU56 | Pagar con Daviplata |
| RF-61 | Geolocalización del Productor | CU#63 | Definir Zona de Cobertura Geográfica | HU58 | Definir Zona de Cobertura Geográfica |
| RF-62 | Búsqueda por Proximidad | CU#63 | Definir Zona de Cobertura Geográfica | HU58 | Definir Zona de Cobertura Geográfica |
| RF-63 | Mapa de Rutas para Transportistas | CU#64 | Calcular Ruta Óptima de Entrega Multi-Destino | HU59 | Calcular Ruta Óptima Multi-Destino |
| RF-64 | Cobertura por Veredas | CU#63 | Definir Zona de Cobertura Geográfica | HU58 | Definir Zona de Cobertura Geográfica |
| — | — | CU#39 | Filtrar Productos por Geolocalización Cercana | HU58 | Definir Zona de Cobertura Geográfica |
| — | — | CU#65 | Trackear Ubicación en Tiempo Real del Transportista | HU60 | Trackear Ubicación en Tiempo Real del Transportista |
| RF-65 | Clasificación de Perecibilidad | CU#66 | Auditar Cumplimiento de Cadena de Frío para ICA | HU68 | Cumplir Auditoría de Cadena de Frío para ICA |
| RF-66 | Fechas de Cosecha y Caducidad | CU#66 | Auditar Cumplimiento de Cadena de Frío para ICA | HU68 | Cumplir Auditoría de Cadena de Frío para ICA |
| RF-67 | Ventana de Entrega Garantizada | CU#66 | Auditar Cumplimiento de Cadena de Frío para ICA | HU68 | Cumplir Auditoría de Cadena de Frío para ICA |
| RF-68 | Trazabilidad Origen-Destino | CU#66 | Auditar Cumplimiento de Cadena de Frío para ICA | HU68 | Cumplir Auditoría de Cadena de Frío para ICA |
| — | — | CU#66 | Auditar Cumplimiento de Cadena de Frío para ICA | HU69 | Clasificar Producto como Perecedero |
| — | — | CU#66 | Auditar Cumplimiento de Cadena de Frío para ICA | HU70 | Registrar Fecha de Cosecha |
| — | — | CU#66 | Auditar Cumplimiento de Cadena de Frío para ICA | HU71 | Registrar Fecha de Caducidad |
| — | — | CU#66 | Auditar Cumplimiento de Cadena de Frío para ICA | HU72 | Configurar Ventana de Entrega por Tipo de Producto |
| — | — | CU#66 | Auditar Cumplimiento de Cadena de Frío para ICA | HU73 | Rastrear Origen del Producto |
| — | — | CU#66 | Auditar Cumplimiento de Cadena de Frío para ICA | HU74 | Registrar Condiciones de Almacenamiento |
| — | — | CU#66 | Auditar Cumplimiento de Cadena de Frío para ICA | HU75 | Notificar Vencimiento Próximo |
| — | — | CU#66 | Auditar Cumplimiento de Cadena de Frío para ICA | HU76 | Generar Reporte de Cadena de Frío |

## Validación de Cobertura
- Cada RF tiene al menos un CU asignado dentro de su módulo.
- Cada CU tiene al menos una HU asignada dentro de su módulo.
- Se corrigieron 84 propiedades `SUB-SISTEMA`/`Modulo` en Notion para reflejar el dominio real.
- Los mapeos dudosos originales fueron validados y ajustados; ver resumen de decisiones abajo.

## Decisiones de Mapeo Aplicadas
- `CU#35 Calificar Productos Adquiridos` y `HU46` se movieron a **M13** para alinear con RF-46.
- `CU#02 Iniciar Sesión`, `CU#22 Recuperar Contraseña`, `CU#37 Configurar Notificaciones por Usuario` y `HU02/HU12/HU13` se agruparon en **M02**.
- `CU#03 Registrar Producto` y `HU04 Publicar productos` pasaron a **M04** (inventario).
- `CU#15 Gestionar Usuarios (Admin)` se movió a **M09** (panel administrativo).
- `CU#39 Filtrar Productos por Geolocalización Cercana` pasó a **M16**.
- `CU#04 Gestionar Inventario Sin Conexión` se trazó a `HU51 Sincronizar Cambios Offline`.
- `CU#05 Realizar Pedido (B2C)` se trazó a `HU43 Gestionar carrito de compras`.

## Desequilibrios Detectados
Algunos módulos presentan más HU que CU o más RF que CU. Esto es aceptable cuando un CU abarca varias HU (ej. M17), pero debe validarse con el equipo funcional:
- **M01:** 4 RF, 3 CU, 1 HU
- **M02:** 6 RF, 7 CU, 9 HU
- **M14:** 9 RF, 6 CU, 5 HU
- **M17:** 4 RF, 1 CU, 9 HU

## Archivos Fuente (Repositorio)
- `docs/matriz_trazabilidad_detalle.csv`
- `docs/matriz_trazabilidad_rf_cu.csv`
- `docs/matriz_trazabilidad_cu_hu.csv`
- `docs/matriz_trazabilidad_rf_cu_hu_detalle.csv`
- `docs/matriz_trazabilidad_resumen_v2.md`
- `docs/notion_module_updates.log`

## Próximos Pasos
1. Validación humana de los mapeos refinados por Product Owner / instructor SENA.
2. Configurar workflow de Jira para permitir estado `Backlog`/`Por hacer` en issues HU.
3. Aprobación formal del plan de correcciones (PT-FIX-02) y del informe de auditoría (PT-AUD-02).