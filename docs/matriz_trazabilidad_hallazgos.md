# Matriz de trazabilidad — hallazgos y corrección (2026-11-02)

## Corrección aplicada (M17)

`cu_hu.csv` contenía **HU70–HU76**, que no existen en `detalle.csv` (HU01–HU69). Se reemplazaron por **HU61–HU67**, todas relacionadas con **CU#66** ("Auditar Cumplimiento de Cadena de Frío para ICA"), el único CU de M17. M17 queda con HU61–HU69, consistente con `rf_cu_hu.csv`.

## HU sin CU (6)

| HU   | Título                 | Módulo                               | CU del módulo (candidatos)                                                                                                                                                                                                                                                      |
| ---- | ---------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HU06 | Solicitud de compra    | M03 — Marketplace Agropecuario       | CU#06 (Publicar Demanda B2B); CU#08 (Calificar Transacción); CU#24 (Explorar Productos del Marketplace); CU#25 (Buscar Productos con Filtros); CU#40 (Comparar Productos Lado a Lado)                                                                                           |
| HU08 | Control de inventario  | M04 — Gestión de Inventarios         | CU#03 (Registrar Producto); CU#27 (Consultar Disponibilidad y Alertas de Inventario); CU#41 (Sincronizar Inventario con Múltiples Dispositivos)                                                                                                                                 |
| HU15 | Búsqueda de usuarios   | M02 — Gestión de Usuarios y Perfiles | CU#01 (Registrar Productor); CU#02 (Iniciar Sesión); CU#22 (Recuperar Contraseña); CU#23 (Editar Perfil de Usuario); CU#26 (Gestionar Reputación del Usuario); CU#37 (Configurar Notificaciones por Usuario); CU#38 (Exportar Datos Personales (Derecho de Acceso Habeas Data)) |
| HU28 | Estados del pedido     | M07 — Gestión de Pedidos             | CU#10 (Gestionar Pedido (Productor)); CU#30 (Consultar Historial de Pedidos); CU#33 (Confirmar Pedido); CU#44 (Cancelar Pedido con Reembolso Automático)                                                                                                                        |
| HU30 | Integración de pagos   | M08 — Pagos y Transacciones          | CU#21 (Registrar Transacción); CU#45 (Procesar Reembolso por Cancelación); CU#46 (Generar Reporte de Transacciones para Contabilidad)                                                                                                                                           |
| HU33 | Gestión de incidencias | M09 — Panel Administrativo           | CU#15 (Gestionar Usuarios (Admin)); CU#16 (Generar Reportes); CU#31 (Monitorear Sistema (Admin)); CU#47 (Banear Usuario por Violación de Términos)                                                                                                                              |

## Totales verificados

- `detalle.csv`: 68 RF + 66 CU + 69 HU = **203 filas**.
- `cu_hu.csv`: **75 relaciones**, 66 CU únicos y **64 HU únicas**. Las 5 HU sin
  relación CU son **HU06, HU08, HU15, HU28 y HU30 de la numeración original**;
  sus equivalencias D7 ya viven en la matriz con los códigos oficiales
  (HU06→HU14, HU15→HU08, HU04→HU11, HU33→CU#31).
- `rf_cu.csv`: 68 RF; `rf_cu_hu_detalle.csv`: 68 RF; `rf_cu_hu.csv`: 17 módulos.

## Recomendación

1. Renumerar fichas, CU y trazabilidad a la numeración v2.0 cuando exista la
   tabla oficial: desbloquea HU06/HU15 y cierra la ambigüedad de HU08, HU11 y
   HU14 desplazados.
2. Declarar en el informe general las HU sin CU por diseño (HU08, HU28 y HU30
   de la numeración original) como cobertura pendiente documentada.
3. Mantener `cu_hu.csv` como fuente curada: el generador solo añade pares
   faltantes y nunca borra relaciones manuales. Ejecutar
   `python3 scripts/build_traceability_matrix.py --check` antes de cada entrega.

> El chequeo automático `traceability-check` reporta 8 HU porque escanea patrones en archivos, no la matriz; no es un indicador fiable para este total.

## Consulta a Notion (2026-11-04)

Se consultó la página oficial **Matriz de Trazabilidad RF↔CU↔HU v4.0** y el
**Anexo — Tabla de Equivalencias de HUs AgroConnect**.

- La matriz detallada tiene 68 filas (RF-01 a RF-68). De las 6 HU pendientes,
  solo **HU33** aparece explícitamente: `RF-33 → CU#31 (Monitorear Sistema
(Admin)) → HU33 (Gestión de incidencias)`.
- **HU06, HU08, HU15, HU28 y HU30 no aparecen** en la tabla detallada de Notion;
  por tanto no existe una relación CU↔HU confirmada para ellas en ese documento.
- El Anexo de Equivalencias advierte que la numeración de las fichas antiguas
  no coincide con el Product Backlog v2.0:
  - HU06 actual → **HU14 oficial candidata** (M13, “Solicitar compra al productor”).
  - HU15 actual → **HU08 oficial candidata** (M02, “Consultar usuarios”).
  - HU04 actual → **HU11 oficial candidata** (M04/M03, “Publicar productos”).
  - La tabla está en estado **v0.1 de trabajo** y exige aprobación de Ferrer y
    Fabián antes de renumerar fichas, casos de prueba, CU o trazabilidad.

## Aprobación D7 (2026-11-05)

Fabián Gallego aprobó la tabla de equivalencias:

- HU06 actual → **HU14 oficial**.
- HU15 actual → **HU08 oficial**.
- HU04 actual → **HU11 oficial**.
- HU33 → **CU#31** (confirmado en la matriz detallada).

La aprobación habilita la renumeración y la actualización de trazabilidad. No
se inventan relaciones para HU08, HU28 ni HU30 porque el SSOT no las contiene;
quedan como cobertura pendiente documentada.

**Conclusión:** D7 aprobada. La regeneración de CSV/matriz debe ejecutarse con
la tabla aprobada y sin inferir las tres relaciones ausentes.

## Aplicación parcial de D7 (2026-11-17)

Se aplicó lo que la decisión aprobada permite sin inventar trazabilidad:

- `cu_hu.csv`: se añadió `CU#31 → HU33` (relación confirmada en la matriz
  detallada de Notion). `CU#31 → HU32` se conserva porque el módulo M09 asocia
  ambos HU.
- `rf_cu_hu_detalle.csv`: la fila RF-33 ahora traza `RF-33 → CU#31 → HU33`.
- `detalle.csv`: las fichas HU04, HU06 y HU15 registran su equivalencia oficial
  (HU11, HU14 y HU08) en `Fuente Asignacion`; HU33 registra `D7: confirmado
  CU#31`. Las cuatro dejan de estar marcadas como dudosas.

### Bloqueo vigente: colisión de numeración

La renumeración completa exige la numeración oficial del Product Backlog v2.0
para las fichas que hoy ocupan los códigos destino:

| Código destino | Ocupado hoy por | Equivalencia D7 que llega |
| --- | --- | --- |
| HU08 | Control de inventario (M04) | HU15 actual (Búsqueda de usuarios) |
| HU11 | Negociación empresarial (M03) | HU04 actual (Publicar productos) |
| HU14 | Panel general (M01) | HU06 actual (Solicitud de compra) |

Sin esa numeración, renombrar produciría códigos duplicados. Por eso no se
renumera y los CSV conservan la numeración de trabajo.

### Verificación

```bash
python3 scripts/build_traceability_matrix.py --check
```

Valida conteos (68 RF, 66 CU, 69 HU), unicidad, ausencia de huecos, 17 módulos,
la relación CU#31→HU33 y que no se hayan inventado relaciones para HU08, HU28
ni HU30.
