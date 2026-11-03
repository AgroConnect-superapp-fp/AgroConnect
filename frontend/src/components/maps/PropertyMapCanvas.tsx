/**
 * Lienzo interactivo del mapa de propiedades.
 *
 * Extraído de `PropertyMap.tsx` (ADR-017, Fase 3). Contiene el `MapContainer`,
 * los marcadores/clústeres, los polígonos y la composición de controles.
 */

import type { MutableRefObject, ReactElement } from 'react';
import type { Map as LeafletMap } from 'leaflet';
import { MapContainer, Marker, Polygon, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from '../../lib/leaflet';
import type { HeatmapPoint, Property } from '../../types/property';
import { getCropInfo } from '../../types/property';
import { createClusterIcon, createCropIcon } from '../../utils/mapIcons';
import { MapControls } from './MapControls';
import { MapDrawing } from './MapDrawing';
import { MapViewport } from './MapViewport';
import { PropertyMapSidebar, ProductiveZonesOverlay } from './PropertyMapSidebar';
import { PropertyMapToolbar } from './PropertyMapToolbar';
import { PropertyPopup } from './PropertyPopup';
import { MAP_CONSTANTS } from './mapConstants';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-geosearch/dist/geosearch.css';
import 'react-leaflet-markercluster/styles';

interface PropertyMapCanvasProps {
  properties: Property[];
  heatmapPoints: HeatmapPoint[];
  mapRef: MutableRefObject<LeafletMap | null>;
  isSearchOpen: boolean;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onPopupOpen: (propertyId: string) => void;
  onPopupClose: () => void;
  showProductiveZones: boolean;
  enableDrawing: boolean;
  onPolygonCreated?: (coords: [number, number][]) => void;
}

export function PropertyMapCanvas({
  properties,
  heatmapPoints,
  mapRef,
  isSearchOpen,
  onOpenSearch,
  onCloseSearch,
  onPopupOpen,
  onPopupClose,
  showProductiveZones,
  enableDrawing,
  onPolygonCreated,
}: PropertyMapCanvasProps): ReactElement {
  return (
    <MapContainer
      center={MAP_CONSTANTS.COLOMBIA_CENTER}
      zoom={MAP_CONSTANTS.DEFAULT_ZOOM}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <MapViewport mapRef={mapRef} />

      <PropertyMapToolbar
        properties={properties}
        isSearchOpen={isSearchOpen}
        onOpenSearch={onOpenSearch}
        onCloseSearch={onCloseSearch}
        onPopupOpen={onPopupOpen}
      >
        <MapControls>
          <ProductiveZonesOverlay enabled={showProductiveZones} points={heatmapPoints} />
        </MapControls>
      </PropertyMapToolbar>

      <MapDrawing enabled={enableDrawing} onPolygonCreated={onPolygonCreated} />

      <PropertyMapSidebar />

      <MarkerClusterGroup
        disableClusteringAtZoom={MAP_CONSTANTS.CLUSTER_DISABLE_ZOOM}
        iconCreateFunction={(cluster: L.MarkerCluster) =>
          createClusterIcon(cluster.getChildCount())
        }
        spiderfyOnMaxZoom={true}
        showCoverageOnHover={false}
        maxClusterRadius={80}
      >
        {properties.map((property) => (
          <Marker
            key={property.id}
            position={[property.lat, property.lng]}
            icon={createCropIcon(property.crop)}
            eventHandlers={{
              popupopen: () => onPopupOpen(property.id),
              popupclose: onPopupClose,
            }}
          >
            <Popup
              maxWidth={520}
              minWidth={450}
              autoPan={true}
              autoPanPadding={[50, 50]}
              closeButton={false}
              closeOnClick={false}
              autoClose={true}
            >
              <PropertyPopup property={property} />
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>

      {properties
        .filter((p) => p.coordinates && p.coordinates.length > 0)
        .map((property) => {
          // ✅ DEFENSIVE: Get crop info once per property
          const cropInfo = getCropInfo(property.crop);

          return (
            <Polygon
              key={`polygon-${property.id}`}
              positions={property.coordinates!}
              pathOptions={{
                color: cropInfo.color,
                fillColor: cropInfo.color,
                fillOpacity: 0.25,
                weight: 2,
              }}
            >
              <Popup
                maxWidth={520}
                minWidth={450}
                autoPan={true}
                autoPanPadding={[50, 50]}
                closeButton={false}
                closeOnClick={false}
                autoClose={true}
              >
                <PropertyPopup property={property} variant="polygon" />
              </Popup>
            </Polygon>
          );
        })}
    </MapContainer>
  );
}
