/**
 * Puente de Leaflet para `useMapViewport`.
 *
 * Debe renderizarse dentro de `<MapContainer>`; no pinta nada.
 */

import type { MutableRefObject } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { useMapViewport } from '../../hooks/useMapViewport';

interface MapViewportProps {
  mapRef: MutableRefObject<LeafletMap | null>;
}

export function MapViewport({ mapRef }: MapViewportProps): null {
  useMapViewport(mapRef);
  return null;
}
