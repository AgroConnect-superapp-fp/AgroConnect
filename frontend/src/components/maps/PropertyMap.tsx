/**
 * Mapa de propiedades de AgroConnect.
 *
 * ADR-017, Fase 3: este componente queda como orquestador. El lienzo
 * (`PropertyMapCanvas`), la barra de búsqueda (`PropertyMapToolbar`) y los
 * elementos auxiliares (`PropertyMapSidebar`) viven en componentes
 * especializados; los hooks de estado se mantienen aquí para no duplicarlos.
 */

import { useRef, type ReactElement } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import type { HeatmapPoint, Property } from '../../types/property';
import { useMapSearch } from '../../hooks/useMapSearch';
import { usePropertySelection } from '../../hooks/usePropertySelection';
import { PropertyMapCanvas } from './PropertyMapCanvas';
import { MAP_CONSTANTS } from './mapConstants';
import { MAP_STYLES_CSS } from './mapStyles';

export interface PropertyMapProps {
  properties: Property[];
  showProductiveZones?: boolean;
  enableDrawing?: boolean;
  onPolygonCreated?: (coords: [number, number][]) => void;
}

export function PropertyMap({
  properties,
  showProductiveZones = false,
  enableDrawing = false,
  onPolygonCreated,
}: PropertyMapProps): ReactElement {
  const heatmapPoints: HeatmapPoint[] = properties.map((p) => ({
    lat: p.lat,
    lng: p.lng,
    intensity: p.productivity / 100,
  }));

  const mapRef = useRef<LeafletMap | null>(null);
  const { isSearchOpen, openSearch, closeSearch } = useMapSearch();
  const { handlePopupOpen, handlePopupClose } = usePropertySelection({
    mapRef,
    properties,
    showProductiveZones,
    enableDrawing,
  });

  return (
    <div
      className={`${MAP_CONSTANTS.MAP_WRAPPER_CLASS} w-full h-[800px] rounded-xl overflow-hidden shadow-lg border border-gray-200 relative`}
      data-search-open={isSearchOpen ? 'true' : 'false'}
    >
      <style>{MAP_STYLES_CSS}</style>

      <PropertyMapCanvas
        properties={properties}
        heatmapPoints={heatmapPoints}
        mapRef={mapRef}
        isSearchOpen={isSearchOpen}
        onOpenSearch={openSearch}
        onCloseSearch={closeSearch}
        onPopupOpen={handlePopupOpen}
        onPopupClose={handlePopupClose}
        showProductiveZones={showProductiveZones}
        enableDrawing={enableDrawing}
        onPolygonCreated={onPolygonCreated}
      />
    </div>
  );
}
