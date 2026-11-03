/**
 * Utilidades de búsqueda del mapa: propiedades locales + lugares de Nominatim.
 *
 * Extraídas de `PropertyMap.tsx` (ADR-017, Fase 2) sin cambiar el
 * comportamiento: mismos textos, misma URL y mismo flujo de popup.
 */

import type { Property } from '../../types/property';
import { getCropInfo } from '../../types/property';
import { devLog } from '../../utils/devLog';
import { MAP_CONSTANTS } from './mapConstants';
import { findMarkerByCoordinates } from './mapUtils';

export interface MapSearchResult {
  x: number;
  y: number;
  label: string;
  bounds: null;
  raw: {
    type: 'property' | 'place';
    data: Property | { name: string; type: string };
  };
}

/**
 * Proveedor combinado: propiedades + OpenStreetMap.
 * Usa `getCropInfo()` para acceso defensivo al catálogo de cultivos.
 */
export class CombinedSearchProvider {
  private readonly properties: Property[];

  constructor(properties: Property[]) {
    this.properties = properties;
  }

  async search({ query }: { query: string }): Promise<MapSearchResult[]> {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    const results: MapSearchResult[] = [];

    const propertyMatches = this.properties.filter((property) => {
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

/** Busca una propiedad por nombre dentro de un texto de resultado. */
export function findPropertyByName(
  text: string,
  properties: Property[]
): Property | null {
  const normalizedText = text.toLowerCase();
  return (
    properties.find((property) => normalizedText.includes(property.name.toLowerCase())) ||
    null
  );
}

/** Limpia el input y el dropdown del control de búsqueda de Leaflet. */
export function clearSearchInput(mapContainer: HTMLElement): void {
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

/** Vuela a una propiedad y abre su popup. */
export function flyToAndOpenPopup(
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

/** Vuela a un lugar geográfico (sin popup). */
export function flyToPlace(
  map: L.Map,
  lat: number,
  lng: number,
  zoom: number = 13
): void {
  devLog('[AgroConnect] 📍 Flying to place:', lat, lng);

  clearSearchInput(map.getContainer());

  map.flyTo([lat, lng], zoom, { duration: 1.2 });
}
