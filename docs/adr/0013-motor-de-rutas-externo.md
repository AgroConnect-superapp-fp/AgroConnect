# ADR-013: Optimización de rutas mediante motor externo detrás del port `RouteOptimizer`

- **Estado**: Aceptada
- **Fecha**: 2026-10-22
- **Decisores**: Equipo AgroConnect
- **Relacionado**: ADR-007 (Leaflet + OSM), ADR-011, CU#64 (Calcular ruta óptima de entrega multidestino)

## Contexto y problema

M06 y M16 requieren calcular rutas de entrega con varios destinos (RF-63, CU#64). Es un problema de enrutamiento de vehículos (VRP), con dos requisitos:

- un grafo vial real (OpenStreetMap),
- un solucionador combinatorio.

Implementarlo en TypeScript no es razonable. Autoalojar OSRM o VROOM con el grafo de Colombia necesita varios GB de RAM, lo que es inviable en el plan gratuito.

## Decisión

1. Definir en el módulo `logistics` el port `RouteOptimizer`:

   ```ts
   optimize(input: { depot: Point; stops: Stop[]; vehicle: VehicleProfile }): Promise<OptimizedRoute>
   ```

2. Implementar el primer adaptador con **OpenRouteService**:
   - endpoint `/optimization` (VROOM gestionado) y `/directions` sobre OSM,
   - plan gratuito con API key,
   - coherente con ADR-007, sin Google Maps.
3. Proteger el adaptador con timeout, reintento con backoff y circuit breaker. Si no hay respuesta, degradar a ordenar las paradas por distancia geodésica con PostGIS (`ST_Distance`).
4. Guardar en caché las rutas calculadas por lote de pedidos.

## Alternativas consideradas

- **Python + OR-Tools en el satélite**: control total, pero hay que construir la matriz de distancias con un motor vial de todas formas. Queda como evolución si las cuotas de ORS no alcanzan.
- **OSRM/VROOM autoalojados**: sin cuotas, pero requieren infraestructura que excede el plan gratuito. Rechazada por ahora.
- **Google Routes API**: prohibida por ADR-007 y de pago.

## Consecuencias

- **Positivas**: capacidad de nivel profesional sin infraestructura propia; el port permite cambiar de motor sin tocar el dominio.
- **Negativas**: dependencia de un tercero con cuotas diarias.
- **Mitigaciones**: degradación con PostGIS, caché y circuit breaker.
- **Implementación**: iteración I+3.
