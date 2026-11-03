/**
 * Persistencia de la propiedad seleccionada en el mapa.
 *
 * Leaflet recrea marcadores cuando cambian las capas o el dibujo. El hook
 * recuerda qué popup estaba abierto y lo restaura después de esos cambios,
 * sin duplicar el estado en `PropertyMap`.
 */

import { useCallback, useEffect, useRef, type MutableRefObject } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { Property } from '../types/property';
import { MAP_CONSTANTS } from '../components/maps/mapConstants';
import { findMarkerByCoordinates } from '../components/maps/mapUtils';
import { devLog } from '../utils/devLog';

const POPUP_RESTORE_DELAY_MS = 100;

export interface UsePropertySelectionOptions {
  mapRef: MutableRefObject<LeafletMap | null>;
  properties: Property[];
  showProductiveZones: boolean;
  enableDrawing: boolean;
}

export interface UsePropertySelectionResult {
  handlePopupOpen: (propertyId: string) => void;
  handlePopupClose: () => void;
}

export function usePropertySelection({
  mapRef,
  properties,
  showProductiveZones,
  enableDrawing,
}: UsePropertySelectionOptions): UsePropertySelectionResult {
  const openPopupPropertyIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!mapRef.current || !openPopupPropertyIdRef.current) return;

    const map = mapRef.current;
    const propertyId = openPopupPropertyIdRef.current;
    const property = properties.find((candidate) => candidate.id === propertyId);

    if (!property) return;

    const timeoutId = setTimeout(() => {
      const marker = findMarkerByCoordinates(
        map,
        property.lat,
        property.lng,
        MAP_CONSTANTS.COORDINATE_TOLERANCE
      );

      if (marker) {
        try {
          marker.openPopup();
          devLog('[AgroConnect] ✅ Popup restored for:', property.name);
        } catch (error) {
          console.warn('[AgroConnect] ⚠️ Could not restore popup:', error);
        }
      }
    }, POPUP_RESTORE_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [mapRef, properties, showProductiveZones, enableDrawing]);

  const handlePopupOpen = useCallback((propertyId: string): void => {
    openPopupPropertyIdRef.current = propertyId;
    devLog('[AgroConnect] 📌 Popup state saved for property:', propertyId);
  }, []);

  const handlePopupClose = useCallback((): void => {
    openPopupPropertyIdRef.current = null;
    devLog('[AgroConnect] 📌 Popup state cleared');
  }, []);

  return { handlePopupOpen, handlePopupClose };
}
