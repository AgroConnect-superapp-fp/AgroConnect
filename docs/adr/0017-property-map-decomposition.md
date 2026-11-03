# ADR-017 — Descomposición progresiva de `PropertyMap`

- **Estado:** Aceptada — Fases 1-3 implementadas; Fase 4 en curso
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

**Resultado:** 2021 → 952 líneas (mejor que el objetivo); componentes y
constantes extraídos sin cambiar el comportamiento.

### Fase 2 — Hooks de estado

Extraer la lógica reutilizable:

- `useMapViewport` (ciclo de vida de la instancia y bloqueo de zoom con popup)
- `useMapSearch`
- `useMapDrawing`
- `usePropertySelection`

Criterio: hooks con tests; sin duplicar estado con el contenedor.

**Resultado:** 952 → 601 líneas; `useMapViewport`, `useMapSearch`,
`useMapDrawing` y `usePropertySelection` extraídos, más los puentes
`MapViewport`/`MapDrawing` y los helpers `mapUtils`/`mapSearchUtils`. El
centro, zoom y bounds siguen siendo propiedad de Leaflet (`MapContainer`); el
hook no los replica en estado React para evitar re-renderizados y doble fuente
de verdad. Tests: 42 unitarios frontend, 10 E2E, lint/typecheck/build verdes.

### Fase 3 — Contenedor orquestador

Separar el layout:

- `PropertyMapCanvas`
- `PropertyMapToolbar`
- `PropertyMapSidebar`

Criterio: `PropertyMap.tsx` < 400 líneas y actúa solo como composición.

**Resultado:** 601 → 69 líneas. `PropertyMap` conserva hooks, wrapper y
composición; `PropertyMapCanvas` (148 líneas) monta `MapContainer`, clusters y
polígonos; `PropertyMapToolbar` (385 líneas) agrupa búsqueda, cierre y toggle;
`PropertyMapSidebar` (138 líneas) agrupa leyenda, atribución y capa de zonas
productivas. El orden de controles Leaflet se preserva con un slot `children`
para que `MapControls` siga entre búsqueda y toggle. Gate: 42 unitarios, lint,
typecheck, build y E2E 10/10 verdes; screenshot del mapa validado.

### Fase 4 — Validación y cierre

- E2E 10/10, screenshot de mapa y popup.
- Revisión de accesibilidad (axe/Lighthouse) y de rendimiento del bundle.
- Sin cambios en contratos de API ni en la URL de Leaflet/OSM.

**Hallazgo pendiente:** el popup de marcador mide ~735 px y el mapa 800 px;
con el padding de `autoPan` no cabe y Leaflet lo posiciona por encima del
contenedor (coordenada Y negativa), por lo que la captura del popup queda
recortada. Es previo a la descomposición (los estilos y `autoPan` no cambiaron).
En Fase 4 se corregirá con `max-height` + scroll interno o reduciendo la
galería, y se repetirá la captura antes de cerrar el ADR.

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
