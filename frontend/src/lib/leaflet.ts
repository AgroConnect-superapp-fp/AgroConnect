import L from 'leaflet';

/**
 * Punto único de Leaflet para el frontend.
 *
 * Los plugins UMD (`leaflet-draw`, `leaflet.heat`) leen `window.L` al
 * evaluarse. Exponer aquí la MISMA instancia que importa React evita cargar
 * dos copias de Leaflet (la del CDN y la del bundle) y que las capas/controles
 * se creen contra instancias distintas.
 */
(window as unknown as { L: typeof L }).L = L;

export default L;
