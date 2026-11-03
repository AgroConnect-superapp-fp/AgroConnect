# ADR-017 — Descomposición progresiva de `PropertyMap`

- **Estado:** Aceptada — Fase 1 implementada
- **Fecha:** 2026-11-03
- **Decisores:** fAb Orq, beru, equipo frontend
- **Relacionado:** ADR-016 (D9, resuelto), ADR-004, ADR-007

## Contexto

`frontend/src/components/maps/PropertyMap.tsx` concentra 2021 líneas y varias
responsabilidades: estado del mapa, búsqueda, dibujo de parcelas, capas,
clusters, popups, leyenda, imágenes y estilos. Funciona y está cubierto por los
E2E actuales, pero cada cambio exige leer un archivo completo y aumenta el
riesgo de regresión. No es un fallo de producción; es deuda de mantenibilidad.

## Decisión

Descomponer de forma incremental, sin reescritura ni cambio de comportamiento,
en cuatro fases. Cada fase debe pasar lint, tipos, build, E2E 10/10 y revisión
visual antes de continuar.

### Fase 1 — Presentación pura

Extraer componentes sin estado ni efectos:

- `MapLegend`
- `PropertyPopup`
- `MapControls` (zoom, reset, capas)
- `MapLoading` / `MapEmptyState`
- Estilos y constantes del mapa (`mapStyles.ts`, `mapConstants.ts`)

Criterio: `PropertyMap.tsx` baja de 2021 a ~1200 líneas; tests unitarios de los
componentes puros.

### Fase 2 — Hooks de estado

Extraer la lógica reutilizable:

- `useMapViewport` (centro, zoom, bounds)
- `useMapSearch`
- `useMapDrawing`
- `usePropertySelection`

Criterio: hooks con tests; sin duplicar estado con el contenedor.

### Fase 3 — Contenedor orquestador

Separar el layout:

- `PropertyMapCanvas`
- `PropertyMapToolbar`
- `PropertyMapSidebar`

Criterio: `PropertyMap.tsx` < 400 líneas y actúa solo como composición.

### Fase 4 — Validación y cierre

- E2E 10/10, screenshot de mapa y popup.
- Revisión de accesibilidad (axe/Lighthouse) y de rendimiento del bundle.
- Sin cambios en contratos de API ni en la URL de Leaflet/OSM.

## Alternativas consideradas

1. **Reescritura total:** descartada por riesgo y por el contexto académico;
   rompe la trazabilidad de los E2E actuales.
2. **No hacer nada:** acepta un archivo de 2021 líneas y fricción creciente.
3. **Extracción por fases:** elegida; permite revisar cada PR por separado.

## Consecuencias

- **Positivas:** menor acoplamiento, revisiones pequeñas, tests por componente y
  menor tiempo de onboarding.
- **Negativas:** varias PRs y una ventana de validación visual; no cambia la
  funcionalidad ni la prioridad de Supabase.
- **Dependencia:** no bloquea ni es bloqueada por la restauración de Supabase.
