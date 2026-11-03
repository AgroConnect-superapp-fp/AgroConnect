/**
 * PropertyMap component with enhanced interactivity.
 *
 * Architecture (v3.24 - Defensive crop access throughout):
 * - All CROP_CATALOG[property.crop] replaced with getCropInfo(property.crop)
 * - popupAnchor: [0, -20] for popup glued to icon with visible tip
 * - Restored original popup width (520/450) for better content display
 * - Restored triangular tip (▲) pointing to icon for premium UX
 * - Close button (✕) unified with search banner style (white/gray/red 24px)
 * - All previous functionality preserved (search, zoom lock, popup persistence)
 */

import React, { useEffect, useCallback, useState, useRef } from 'react';
import { devLog } from '../../utils/devLog';
import {
  MapContainer,
  Marker,
  Popup,
  Polygon,
  LayersControl,
  useMap,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from '../../lib/leaflet';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-geosearch/dist/geosearch.css';
import 'react-leaflet-markercluster/styles';

import type { Property, HeatmapPoint } from '../../types/property';
import { getCropInfo } from '../../types/property';
import { createCropIcon, createClusterIcon } from '../../utils/mapIcons';
import { escapeHtml } from '../../utils/escapeHtml';
import { useLeafletDraw } from '../../hooks/useLeafletDraw';
import { MapControls } from './MapControls';
import { MapLegend } from './MapLegend';
import { PropertyPopup } from './PropertyPopup';
import { MAP_CONSTANTS, PRODUCTIVITY_HEAT_GRADIENT } from './mapConstants';
import { MAP_STYLES_CSS } from './mapStyles';

/**
 * Combined search provider: Properties + OpenStreetMap places.
 * Uses getCropInfo() for safe access to crop display names.
 */
class CombinedSearchProvider {
  private properties: Property[];

  constructor(properties: Property[]) {
    this.properties = properties;
  }

  async search({ query }: { query: string }): Promise<
    Array<{
      x: number;
      y: number;
      label: string;
      bounds: null;
      raw: {
        type: 'property' | 'place';
        data: Property | { name: string; type: string };
      };
    }>
  > {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    const results: Array<{
      x: number;
      y: number;
      label: string;
      bounds: null;
      raw: {
        type: 'property' | 'place';
        data: Property | { name: string; type: string };
      };
    }> = [];

    const propertyMatches = this.properties.filter((property) => {
      // ✅ DEFENSIVE: Use getCropInfo() instead of direct CROP_CATALOG access
      const cropDisplayName = getCropInfo(property.crop).displayName;
      const searchableText = [
        property.name,
        property.owner,
        property.department,
        property.municipality,
        cropDisplayName,
      ]
        .join(' ')
        .toLowerCase();
      return searchableText.includes(normalizedQuery);
    });

    propertyMatches.forEach((property) => {
      results.push({
        x: property.lng,
        y: property.lat,
        label: `🌱 ${property.name} - ${property.municipality}, ${property.department}`,
        bounds: null,
        raw: { type: 'property', data: property },
      });
    });

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=co`,
        {
          headers: {
            'User-Agent': 'AgroConnect/1.0 (SENA Project)',
          },
        }
      );

      if (response.ok) {
        const places = await response.json();
        places.forEach(
          (place: { lat: string; lon: string; display_name: string; type: string }) => {
            results.push({
              x: parseFloat(place.lon),
              y: parseFloat(place.lat),
              label: `📍 ${place.display_name}`,
              bounds: null,
              raw: {
                type: 'place',
                data: { name: place.display_name, type: place.type },
              },
            });
          }
        );
      }
    } catch (error) {
      console.warn('[AgroConnect] Nominatim search failed:', error);
    }

    return results;
  }
}

/**
 * Helper function: find property by name in text
 */
function findPropertyByName(text: string, properties: Property[]): Property | null {
  const normalizedText = text.toLowerCase();
  return (
    properties.find((prop) => normalizedText.includes(prop.name.toLowerCase())) || null
  );
}

/**
 * Helper function: find marker by coordinates in map layers
 */
function findMarkerByCoordinates(
  map: L.Map,
  lat: number,
  lng: number,
  tolerance: number
): L.Marker | null {
  let targetMarker: L.Marker | null = null;

  map.eachLayer((layer: L.Layer) => {
    if (layer instanceof L.Marker) {
      const ll = layer.getLatLng();
      if (Math.abs(ll.lat - lat) < tolerance && Math.abs(ll.lng - lng) < tolerance) {
        targetMarker = layer;
      }
    }
  });

  return targetMarker;
}

/**
 * Helper function: clear search input and close suggestions dropdown.
 */
function clearSearchInput(mapContainer: HTMLElement): void {
  const input = mapContainer.querySelector<HTMLInputElement>(
    `.${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} input`
  );

  const resultsContainer = mapContainer.querySelector<HTMLElement>(
    `.${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} .results`
  );

  if (input) {
    input.value = '';
    const inputEvent = new Event('input', { bubbles: true });
    input.dispatchEvent(inputEvent);
    input.blur();
  }

  setTimeout(() => {
    if (resultsContainer) {
      resultsContainer.innerHTML = '';
      devLog('[AgroConnect] 🧹 Results container cleared');
    }
  }, 50);

  devLog('[AgroConnect] 🧹 Search input cleared');
}

/**
 * Helper function: fly to location and open popup (for properties)
 */
function flyToAndOpenPopup(
  map: L.Map,
  property: Property,
  isMounted: { current: boolean },
  onPopupOpen?: (propertyId: string) => void
): void {
  devLog('[AgroConnect] 🎯 Flying to property:', property.name);

  const mapContainer = map.getContainer();
  const targetLatLng: L.LatLngExpression = [property.lat, property.lng];

  clearSearchInput(mapContainer);

  map.flyTo(targetLatLng, MAP_CONSTANTS.SEARCH_RESULT_ZOOM, {
    duration: 1.5,
  });

  setTimeout(() => {
    if (!isMounted.current) return;

    const targetMarker = findMarkerByCoordinates(
      map,
      property.lat,
      property.lng,
      MAP_CONSTANTS.COORDINATE_TOLERANCE
    );

    if (targetMarker !== null) {
      const markerRef: L.Marker = targetMarker;
      devLog('[AgroConnect] ✅ Marker found, opening popup');

      map.closePopup();

      setTimeout(() => {
        try {
          markerRef.openPopup();
          devLog('[AgroConnect] ✅ Popup opened successfully for:', property.name);

          if (onPopupOpen) {
            onPopupOpen(property.id);
          }
        } catch (err) {
          console.warn('[AgroConnect] ⚠️ openPopup failed, trying fire(click):', err);
          try {
            markerRef.fire('click');
          } catch (clickErr) {
            console.error('[AgroConnect] ❌ Could not open popup:', clickErr);
          }
        }
      }, 200);
    } else {
      console.warn('[AgroConnect] ⚠️ Marker not found after flyTo');
    }
  }, 1700);
}

/**
 * Helper function: fly to geographic place (no popup)
 */
function flyToPlace(map: L.Map, lat: number, lng: number, zoom: number = 13): void {
  devLog('[AgroConnect] 📍 Flying to place:', lat, lng);

  const mapContainer = map.getContainer();
  clearSearchInput(mapContainer);

  map.flyTo([lat, lng], zoom, { duration: 1.2 });
}

/**
 * Map Instance Capture component.
 */
function MapInstanceCapture({
  mapRef,
}: {
  mapRef: React.MutableRefObject<L.Map | null>;
}): null {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
    devLog('[AgroConnect] 🗺️ Map instance captured');
  }, [map, mapRef]);

  return null;
}

/**
 * Zoom Lock on Popup component.
 */
function ZoomLockOnPopup(): null {
  const map = useMap();

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

  return null;
}

/**
 * Search Control using EVENT DELEGATION on mapContainer.
 */
function SearchControl({
  properties,
  onPopupOpen,
}: {
  properties: Property[];
  onPopupOpen: (propertyId: string) => void;
}): null {
  const map = useMap();

  useEffect(() => {
    devLog('[AgroConnect] 🔧 SearchControl useEffect started');

    const mapContainer = map.getContainer();
    const existingControl = mapContainer.querySelector(
      `.${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS}`
    );
    if (existingControl) {
      devLog('[AgroConnect] ⚠️ Control already exists, skipping');
      return;
    }

    let control: InstanceType<typeof import('leaflet-geosearch').SearchControl> | null =
      null;
    const isMounted = { current: true };
    let observer: MutationObserver | null = null;
    let formSubmitHandler: ((e: Event) => void) | null = null;

    const globalClickHandler = (e: Event) => {
      const target = e.target as HTMLElement;

      const resultItem = target.closest(
        `.${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} .results > *`
      ) as HTMLElement | null;

      if (!resultItem) return;

      e.preventDefault();
      e.stopPropagation();

      const resultText = resultItem.textContent || '';
      devLog('[AgroConnect] 🖱️ Result clicked:', resultText);

      if (resultText.startsWith('🌱')) {
        const selectedProperty = findPropertyByName(resultText, properties);

        if (selectedProperty) {
          devLog('[AgroConnect] ✅ Property found:', selectedProperty.name);
          flyToAndOpenPopup(map, selectedProperty, isMounted, onPopupOpen);
        }
      } else if (resultText.startsWith('📍')) {
        const placeName = resultText.substring(2).trim();
        devLog('[AgroConnect] 📍 Place selected:', placeName);

        fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(placeName)}&limit=1&countrycodes=co`,
          {
            headers: {
              'User-Agent': 'AgroConnect/1.0 (SENA Project)',
            },
          }
        )
          .then((response) => response.json())
          .then((places) => {
            if (places.length > 0) {
              const place = places[0];
              flyToPlace(map, parseFloat(place.lat), parseFloat(place.lon), 13);
            }
          })
          .catch((error) => {
            console.warn('[AgroConnect] ⚠️ Place fetch failed:', error);
          });
      }
    };

    mapContainer.addEventListener('click', globalClickHandler, true);
    devLog('[AgroConnect] 👂 Global click handler attached');

    const init = async (): Promise<void> => {
      try {
        devLog('[AgroConnect] 📦 Importing leaflet-geosearch...');
        const { SearchControl: SearchControlClass } = await import('leaflet-geosearch');
        if (!isMounted.current) return;

        const provider = new CombinedSearchProvider(properties);
        // leaflet-geosearch pinta cada resultado con innerHTML y los nombres vienen de la BD y de
        // Nominatim: se escapan para evitar XSS. `resultFormat` existe en el runtime 4.4 pero no
        // en `SearchControlOptions`, por eso va en un objeto aparte.
        const escapedResultFormat = {
          resultFormat: ({ result }: { result: { label: string } }) =>
            escapeHtml(result.label),
        };
        control = new SearchControlClass({
          provider: provider as unknown as never,
          style: 'bar',
          searchLabel: '¿Qué estás buscando?',
          autoClose: false,
          showMarker: false,
          animateZoom: true,
          position: 'topright',
          notFoundMessage: 'No se encontró ninguna opción, busca nuevamente !!!',
          ...escapedResultFormat,
        });

        map.addControl(control as unknown as L.Control);
        devLog('[AgroConnect] ✅ SearchControl added to map');

        observer = new MutationObserver(() => {
          if (!isMounted.current) return;

          const form = mapContainer.querySelector<HTMLFormElement>(
            `.${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} form`
          );

          if (form && !formSubmitHandler) {
            devLog('[AgroConnect] 📋 Form detected');

            formSubmitHandler = (e: Event) => {
              e.preventDefault();
              e.stopPropagation();

              const input = form.querySelector<HTMLInputElement>('input');
              const queryValue = input?.value.trim() || '';

              devLog('[AgroConnect] 📝 Form submitted:', queryValue);
              if (!queryValue) return;

              const matchedProperty = findPropertyByName(queryValue, properties);

              if (matchedProperty) {
                devLog('[AgroConnect] ✅ Enter matched:', matchedProperty.name);
                flyToAndOpenPopup(map, matchedProperty, isMounted, onPopupOpen);
              } else {
                devLog('[AgroConnect] 🔍 Searching place:', queryValue);

                fetch(
                  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryValue)}&limit=1&countrycodes=co`,
                  {
                    headers: {
                      'User-Agent': 'AgroConnect/1.0 (SENA Project)',
                    },
                  }
                )
                  .then((response) => response.json())
                  .then((places) => {
                    if (places.length > 0) {
                      const place = places[0];
                      flyToPlace(map, parseFloat(place.lat), parseFloat(place.lon), 13);
                    }
                  })
                  .catch((error) => {
                    console.warn('[AgroConnect] ⚠️ Place search failed:', error);
                  });
              }
            };

            form.addEventListener('submit', formSubmitHandler, true);
          }
        });

        observer.observe(mapContainer, {
          childList: true,
          subtree: true,
        });
      } catch (error) {
        console.error('[AgroConnect] ❌ Error initializing SearchControl:', error);
      }
    };

    void init();

    return () => {
      devLog('[AgroConnect] 🧹 SearchControl cleanup');
      isMounted.current = false;

      mapContainer.removeEventListener('click', globalClickHandler, true);

      if (observer) {
        observer.disconnect();
        observer = null;
      }

      if (formSubmitHandler) {
        const form = mapContainer.querySelector<HTMLFormElement>(
          `.${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} form`
        );
        if (form) {
          form.removeEventListener('submit', formSubmitHandler, true);
        }
      }

      if (control) {
        try {
          map.removeControl(control as unknown as L.Control);
        } catch {
          // Ignore cleanup errors
        }
        control = null;
      }

      const orphan = mapContainer.querySelector(
        `.${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS}`
      );
      if (orphan && orphan.parentNode) orphan.parentNode.removeChild(orphan);
    };
  }, [map, properties, onPopupOpen]);

  return null;
}

/**
 * Injects the Close button (X) INSIDE the search form.
 */
function InjectCloseButton({ onClose }: { onClose: () => void }): null {
  const map = useMap();

  useEffect(() => {
    const mapContainer = map.getContainer();
    let isMounted = true;
    let injectedButton: HTMLButtonElement | null = null;
    let observer: MutationObserver | null = null;

    observer = new MutationObserver(() => {
      if (!isMounted) return;

      const form = mapContainer.querySelector<HTMLFormElement>(
        `.${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} form`
      );

      if (form && !form.querySelector(`.${MAP_CONSTANTS.CLOSE_BTN_CLASS}`)) {
        const nativeReset = form.querySelector<HTMLButtonElement>('button.reset');
        if (nativeReset) {
          nativeReset.style.display = 'none';
          nativeReset.style.visibility = 'hidden';
        }

        injectedButton = document.createElement('button');
        injectedButton.type = 'button';
        injectedButton.className = MAP_CONSTANTS.CLOSE_BTN_CLASS;
        injectedButton.setAttribute('aria-label', 'Cerrar búsqueda');
        injectedButton.setAttribute('title', 'Cerrar Campo de Búsqueda');
        injectedButton.textContent = '✕';

        injectedButton.addEventListener('click', (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        });

        form.appendChild(injectedButton);
      }
    });

    observer.observe(mapContainer, {
      childList: true,
      subtree: true,
    });

    return () => {
      isMounted = false;
      if (observer) {
        observer.disconnect();
        observer = null;
      }
      if (injectedButton && injectedButton.parentNode) {
        injectedButton.parentNode.removeChild(injectedButton);
      }
    };
  }, [map, onClose]);

  return null;
}

/**
 * Toggle button (🔍) as a Leaflet Control.
 */
function SearchToggleLeafletControl({
  visible,
  onOpen,
}: {
  visible: boolean;
  onOpen: () => void;
}): null {
  const map = useMap();

  useEffect(() => {
    if (!visible) return;

    const ControlClass = L.Control.extend({
      onAdd() {
        const container = L.DomUtil.create(
          'div',
          `${MAP_CONSTANTS.TOGGLE_CONTROL_CLASS} leaflet-bar`
        );
        const button = L.DomUtil.create('a', '', container);
        button.href = '#';
        button.title = 'Abrir Campo de Búsqueda';
        button.setAttribute('role', 'button');
        button.setAttribute('aria-label', 'Abrir búsqueda de propiedades');
        button.innerHTML = '🔍';

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        L.DomEvent.on(button, 'click', (e) => {
          L.DomEvent.preventDefault(e);
          L.DomEvent.stopPropagation(e);
          onOpen();
        });

        return container;
      },
    });

    const control = new ControlClass({ position: 'topright' });
    map.addControl(control);

    return () => {
      try {
        map.removeControl(control);
      } catch {
        // Ignore cleanup errors
      }
    };
  }, [map, visible, onOpen]);

  return null;
}

/**
 * Productive Zones Layer component.
 */
function ProductiveZonesLayer({ points }: { points: HeatmapPoint[] }): null {
  const map = useMap();

  useEffect(() => {
    let heatLayer: L.Layer | null = null;
    let isMounted = true;

    const init = async (): Promise<void> => {
      await import('leaflet.heat');
      if (!isMounted) return;

      const latlngs: L.HeatLatLngTuple[] = points.map((p) => [p.lat, p.lng, p.intensity]);

      heatLayer = L.heatLayer(latlngs, {
        radius: 30,
        blur: 20,
        maxZoom: 12,
        gradient: PRODUCTIVITY_HEAT_GRADIENT,
      });

      heatLayer.addTo(map);
    };

    void init();

    return () => {
      isMounted = false;
      if (heatLayer) {
        try {
          map.removeLayer(heatLayer);
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, [map, points]);

  return null;
}

/**
 * Attribution External Links component.
 */
function AttributionExternalLinks(): null {
  const map = useMap();

  useEffect(() => {
    const fixAttributionLinks = (): void => {
      const container = map.getContainer();
      const attributionControl = container.querySelector('.leaflet-control-attribution');
      if (!attributionControl) return;
      const links = attributionControl.querySelectorAll('a');
      links.forEach((link) => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        link.removeAttribute('title');
      });
    };

    const timeoutId = setTimeout(fixAttributionLinks, 100);
    const observer = new MutationObserver(fixAttributionLinks);
    observer.observe(map.getContainer(), {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href', 'title'],
    });

    map.on('baselayerchange', fixAttributionLinks);
    map.on('overlayadd', fixAttributionLinks);
    map.on('overlayremove', fixAttributionLinks);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
      map.off('baselayerchange', fixAttributionLinks);
      map.off('overlayadd', fixAttributionLinks);
      map.off('overlayremove', fixAttributionLinks);
    };
  }, [map]);

  return null;
}

/**
 * Drawing Tools component.
 */
function DrawingTools({
  enabled,
  onPolygonCreated,
}: {
  enabled: boolean;
  onPolygonCreated?: (coords: [number, number][]) => void;
}): null {
  useLeafletDraw({ enabled, onPolygonCreated });
  return null;
}

/**
 * Main PropertyMap component.
 */
interface PropertyMapProps {
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
}: PropertyMapProps): React.ReactElement {
  const heatmapPoints: HeatmapPoint[] = properties.map((p) => ({
    lat: p.lat,
    lng: p.lng,
    intensity: p.productivity / 100,
  }));

  const [isSearchOpen, setIsSearchOpen] = useState(true);

  const openPopupPropertyIdRef = useRef<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const handleOpenSearch = useCallback(() => {
    setIsSearchOpen(true);
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(
        `.${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} input`
      );
      if (input) {
        input.focus();
        input.select();
      }
    }, 150);
  }, []);

  // Restore popup after layer/drawing changes
  useEffect(() => {
    if (!mapRef.current || !openPopupPropertyIdRef.current) return;

    const map = mapRef.current;
    const propertyId = openPopupPropertyIdRef.current;
    const property = properties.find((p) => p.id === propertyId);

    if (!property) return;

    setTimeout(() => {
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
        } catch (err) {
          console.warn('[AgroConnect] ⚠️ Could not restore popup:', err);
        }
      }
    }, 100);
  }, [showProductiveZones, enableDrawing, properties]);

  const handlePopupOpen = useCallback((propertyId: string) => {
    openPopupPropertyIdRef.current = propertyId;
    devLog('[AgroConnect] 📌 Popup state saved for property:', propertyId);
  }, []);

  const handlePopupClose = useCallback(() => {
    openPopupPropertyIdRef.current = null;
    devLog('[AgroConnect] 📌 Popup state cleared');
  }, []);

  return (
    <div
      className={`${MAP_CONSTANTS.MAP_WRAPPER_CLASS} w-full h-[800px] rounded-xl overflow-hidden shadow-lg border border-gray-200 relative`}
      data-search-open={isSearchOpen ? 'true' : 'false'}
    >
      <style>{MAP_STYLES_CSS}</style>

      <MapContainer
        center={MAP_CONSTANTS.COLOMBIA_CENTER}
        zoom={MAP_CONSTANTS.DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <MapInstanceCapture mapRef={mapRef} />

        <ZoomLockOnPopup />

        <SearchControl properties={properties} onPopupOpen={handlePopupOpen} />
        <InjectCloseButton onClose={handleCloseSearch} />

        <MapControls>
          {showProductiveZones && (
            <LayersControl.Overlay checked name="📊 Zonas Productivas">
              <ProductiveZonesLayer points={heatmapPoints} />
            </LayersControl.Overlay>
          )}
        </MapControls>

        <SearchToggleLeafletControl visible={!isSearchOpen} onOpen={handleOpenSearch} />

        <DrawingTools enabled={enableDrawing} onPolygonCreated={onPolygonCreated} />

        <MapLegend />
        <AttributionExternalLinks />

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
                popupopen: () => handlePopupOpen(property.id),
                popupclose: handlePopupClose,
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
    </div>
  );
}
