/**
 * Captura la instancia de Leaflet y bloquea la interacción de zoom mientras
 * hay un popup abierto.
 *
 * La captura vive en un hook para que el contenedor pueda compartir el mismo
 * `mapRef` con la selección de propiedades sin duplicar el estado del mapa.
 */

import { useEffect, type MutableRefObject } from 'react';
import { useMap } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { devLog } from '../utils/devLog';

export function useMapViewport(mapRef: MutableRefObject<LeafletMap | null>): void {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    devLog('[AgroConnect] 🗺️ Map instance captured');
  }, [map, mapRef]);

  useEffect(() => {
    const mapContainer = map.getContainer();

    const disableZoom = (): void => {
      devLog('[AgroConnect] 🔒 Zoom disabled (popup open)');

      if (map.scrollWheelZoom) map.scrollWheelZoom.disable();
      if (map.doubleClickZoom) map.doubleClickZoom.disable();
      if (map.touchZoom) map.touchZoom.disable();
      if (map.boxZoom) map.boxZoom.disable();

      mapContainer.setAttribute('data-popup-open', 'true');
    };

    const enableZoom = (): void => {
      devLog('[AgroConnect] 🔓 Zoom enabled (popup closed)');

      if (map.scrollWheelZoom) map.scrollWheelZoom.enable();
      if (map.doubleClickZoom) map.doubleClickZoom.enable();
      if (map.touchZoom) map.touchZoom.enable();
      if (map.boxZoom) map.boxZoom.enable();

      mapContainer.removeAttribute('data-popup-open');
    };

    map.on('popupopen', disableZoom);
    map.on('popupclose', enableZoom);

    return () => {
      map.off('popupopen', disableZoom);
      map.off('popupclose', enableZoom);
      enableZoom();
    };
  }, [map]);
}
