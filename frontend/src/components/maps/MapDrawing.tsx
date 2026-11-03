/**
 * Puente de Leaflet para `useMapDrawing`.
 *
 * Debe renderizarse dentro de `<MapContainer>`; no pinta nada.
 */

import { useMapDrawing } from '../../hooks/useMapDrawing';

interface MapDrawingProps {
  enabled: boolean;
  onPolygonCreated?: (coords: [number, number][]) => void;
}

export function MapDrawing({ enabled, onPolygonCreated }: MapDrawingProps): null {
  useMapDrawing({ enabled, onPolygonCreated });
  return null;
}
