# Diagramas UML de casos de uso — M13 a M17

Fuente **PlantUML** de los cinco diagramas que `PT-ECU-01 v1.1 OFICIAL` declaraba pendientes de elaboración (hallazgo H11). Generados el 3 de octubre de 2026 durante el sprint de modelado, derivados de los casos de uso y requisitos de `PT-ERS-01 v1.4` y de la Matriz de Trazabilidad v4.0.

## Contenido

| Módulo | Fuente PlantUML | Render SVG | CU cubiertos |
|---|---|---|---|
| M13 — Gestión de Compras | `m13-gestion-compras.puml` | `M13-gestion-compras.svg` | CU#05, CU#32, CU#34, CU#35, CU#53 |
| M14 — Multicanal y Operación Offline | `m14-multicanal-offline.puml` | `M14-multicanal-offline.svg` | CU#04, CU#54, CU#55, CU#56, CU#57, CU#58 |
| M15 — Pagos Locales Colombianos | `m15-pagos-locales.puml` | `M15-pagos-locales.svg` | CU#59, CU#60, CU#61, CU#62 |
| M16 — Geolocalización y Logística Rural | `m16-geolocalizacion-rural.puml` | `M16-geolocalizacion-rural.svg` | CU#39, CU#63, CU#64, CU#65 |
| M17 — Manejo de Productos Perecederos | `m17-productos-perecederos.puml` | `M17-productos-perecederos.svg` | CU#66 (cubre HU61–HU69) |

## Cómo renderizar

Requiere Java 17+ y `plantuml.jar` ([releases oficiales](https://github.com/plantuml/plantuml/releases)):

```bash
java -jar plantuml.jar -tsvg docs/uml/*.puml
```

El comando regenera los SVG junto a las fuentes. Para PNG:

```bash
java -jar plantuml.jar -tpng docs/uml/*.puml
```

## Cómo integrarlos en el SSOT (Notion)

1. Abrir `PT-ECU-01` → sección 3.2.13 a 3.2.17 (subsistemas M13–M17).
2. Reemplazar la nota "Diagrama UML pendiente de elaboración en Sprint 7" por la imagen SVG correspondiente.
3. Registrar el cambio en el historial de revisión del documento (v1.2) según el control de cambios SENA.

## Convenciones aplicadas

- Relaciones `<<include>>` para comportamiento obligatorio (p. ej. sincronización → idempotencia/LWW) y `<<extend>>` para comportamiento opcional (p. ej. código de descuento → checkout).
- Actores formales del sistema (PT-ERS-01 v1.4): Productor Agrícola, Comprador, Transportista, Administrador, Soporte/Moderador y AgroBot; los sistemas externos (SMS, PSE, DIAN, ICA) se modelan como actores secundarios.
- Sub-casos derivados de historias de usuario (M17) sin numeración `CU#` propia, para no alterar la línea base de 66 CU.
