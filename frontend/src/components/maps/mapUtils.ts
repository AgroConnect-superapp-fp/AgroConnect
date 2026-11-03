/**
 * Utilidades compartidas de Leaflet para el mapa de propiedades.
 *
 * `findMarkerByCoordinates` la usan tanto la búsqueda como la restauración de
 * popups; vive aquí para no duplicar el recorrido de capas.
 */

import L from '../../lib/leaflet';

/** Busca un marcador por coordenadas con tolerancia (grados decimales). */
export function findMarkerByCoordinates(
  map: L.Map,
  lat: number,
  lng: number,
  tolerance: number
): L.Marker | null {
  let targetMarker: L.Marker | null = null;

  map.eachLayer((layer: L.Layer) => {
    if (layer instanceof L.Marker) {
      const position = layer.getLatLng();
      if (
        Math.abs(position.lat - lat) < tolerance &&
        Math.abs(position.lng - lng) < tolerance
      ) {
        targetMarker = layer;
      }
    }
  });

  return targetMarker;
}
