# Matriz de trazabilidad — hallazgos y corrección (2026-11-02)

## Corrección aplicada (M17)

`cu_hu.csv` contenía **HU70–HU76**, que no existen en `detalle.csv` (HU01–HU69). Se reemplazaron por **HU61–HU67**, todas relacionadas con **CU#66** ("Auditar Cumplimiento de Cadena de Frío para ICA"), el único CU de M17. M17 queda con HU61–HU69, consistente con `rf_cu_hu.csv`.

## HU sin CU (6)

| HU | Título | Módulo | CU del módulo (candidatos) |
|---|---|---|---|
| HU06 | Solicitud de compra | M03 — Marketplace Agropecuario | CU#06 (Publicar Demanda B2B); CU#08 (Calificar Transacción); CU#24 (Explorar Productos del Marketplace); CU#25 (Buscar Productos con Filtros); CU#40 (Comparar Productos Lado a Lado) |
| HU08 | Control de inventario | M04 — Gestión de Inventarios | CU#03 (Registrar Producto); CU#27 (Consultar Disponibilidad y Alertas de Inventario); CU#41 (Sincronizar Inventario con Múltiples Dispositivos) |
| HU15 | Búsqueda de usuarios | M02 — Gestión de Usuarios y Perfiles | CU#01 (Registrar Productor); CU#02 (Iniciar Sesión); CU#22 (Recuperar Contraseña); CU#23 (Editar Perfil de Usuario); CU#26 (Gestionar Reputación del Usuario); CU#37 (Configurar Notificaciones por Usuario); CU#38 (Exportar Datos Personales (Derecho de Acceso Habeas Data)) |
| HU28 | Estados del pedido | M07 — Gestión de Pedidos | CU#10 (Gestionar Pedido (Productor)); CU#30 (Consultar Historial de Pedidos); CU#33 (Confirmar Pedido); CU#44 (Cancelar Pedido con Reembolso Automático) |
| HU30 | Integración de pagos | M08 — Pagos y Transacciones | CU#21 (Registrar Transacción); CU#45 (Procesar Reembolso por Cancelación); CU#46 (Generar Reporte de Transacciones para Contabilidad) |
| HU33 | Gestión de incidencias | M09 — Panel Administrativo | CU#15 (Gestionar Usuarios (Admin)); CU#16 (Generar Reportes); CU#31 (Monitorear Sistema (Admin)); CU#47 (Banear Usuario por Violación de Términos) |

## Totales verificados

- `detalle.csv`: 68 RF + 66 CU + 69 HU = **203 filas**.
- `cu_hu.csv`: **74 relaciones**, 66 CU únicos y **63 HU únicas**; faltan 6 HU por relación.
- `rf_cu.csv`: 68 RF; `rf_cu_hu_detalle.csv`: 68 RF; `rf_cu_hu.csv`: 17 módulos.

## Recomendación

1. Validar las 6 relaciones en la matriz de Notion (SSOT) y agregarlas al CSV; no se infieren por título para no inventar trazabilidad.
2. Si alguna HU no tiene CU por diseño, marcarla como cobertura pendiente en el informe general.
3. Regenerar los `.md` derivados con `scripts/build_traceability_matrix.py` cuando Notion esté disponible.

> El chequeo automático `traceability-check` reporta 8 HU porque escanea patrones en archivos, no la matriz; no es un indicador fiable para este total.
