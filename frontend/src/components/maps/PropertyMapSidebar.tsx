/**
 * Elementos auxiliares del mapa de propiedades.
 *
 * Extraída de `PropertyMap.tsx` (ADR-017, Fase 3). `PropertyMapSidebar`
 * agrupa el chrome que Leaflet posiciona como controles (leyenda y
 * atribución); `ProductiveZonesOverlay` se exporta aparte porque debe
 * montarse dentro de `MapControls` (`LayersControl`).
 */

import { useEffect, type ReactElement } from 'react';
import { LayersControl, useMap } from 'react-leaflet';
import L from '../../lib/leaflet';
import type { HeatmapPoint } from '../../types/property';
import { MapLegend } from './MapLegend';
import { PRODUCTIVITY_HEAT_GRADIENT } from './mapConstants';

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

interface ProductiveZonesOverlayProps {
  enabled: boolean;
  points: HeatmapPoint[];
}

/**
 * Overlay de zonas productivas para `MapControls`.
 *
 * Devuelve `null` cuando la capa está desactivada, igual que el render
 * condicional original de `PropertyMap`.
 */
export function ProductiveZonesOverlay({
  enabled,
  points,
}: ProductiveZonesOverlayProps): ReactElement | null {
  if (!enabled) return null;

  return (
    <LayersControl.Overlay checked name="📊 Zonas Productivas">
      <ProductiveZonesLayer points={points} />
    </LayersControl.Overlay>
  );
}

/**
 * Leyenda y atribución del mapa.
 */
export function PropertyMapSidebar(): ReactElement {
  return (
    <>
      <MapLegend />
      <AttributionExternalLinks />
    </>
  );
}
