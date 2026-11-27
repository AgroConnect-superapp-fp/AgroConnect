/**
 * Barra de búsqueda del mapa de propiedades.
 *
 * Extraída de `PropertyMap.tsx` (ADR-017, Fase 3). Agrupa el buscador de
 * Leaflet, el botón de cierre inyectado en el formulario y el toggle que
 * abre/cierra la búsqueda. El orden de montaje se conserva para no alterar
 * la posición de los controles de Leaflet.
 */

import { useEffect, type ReactElement, type ReactNode } from 'react';
import { useMap } from 'react-leaflet';
import L from '../../lib/leaflet';
import type { Property } from '../../types/property';
import { devLog } from '../../utils/devLog';
import { escapeHtml } from '../../utils/escapeHtml';
import { MAP_CONSTANTS } from './mapConstants';
import {
  CombinedSearchProvider,
  findPropertyByName,
  flyToAndOpenPopup,
  flyToPlace,
} from './mapSearchUtils';

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

interface PropertyMapToolbarProps {
  properties: Property[];
  isSearchOpen: boolean;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onPopupOpen: (propertyId: string) => void;
  /**
   * Controles que deben montarse entre el buscador y el toggle (por ejemplo,
   * `MapControls`). Mantener este orden conserva la posición de los controles
   * de Leaflet en la esquina superior derecha.
   */
  children?: ReactNode;
}

export function PropertyMapToolbar({
  properties,
  isSearchOpen,
  onOpenSearch,
  onCloseSearch,
  onPopupOpen,
  children,
}: PropertyMapToolbarProps): ReactElement {
  return (
    <>
      <SearchControl properties={properties} onPopupOpen={onPopupOpen} />
      <InjectCloseButton onClose={onCloseSearch} />
      {children}
      <SearchToggleLeafletControl visible={!isSearchOpen} onOpen={onOpenSearch} />
    </>
  );
}
