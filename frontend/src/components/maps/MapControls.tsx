/**
 * Controles del mapa: zoom, reset y capas base.
 *
 * Extraído de `PropertyMap.tsx` (ADR-017, Fase 1). Envuelve los controles
 * existentes (`CustomZoomControl`, `ResetViewControl`) y compone el
 * `LayersControl` con las capas base; los overlays con lógica de Leaflet
 * (zonas productivas) siguen viviendo en `PropertyMap` y se pasan como
 * `children` para no duplicar ni mover esa lógica.
 */

import type { ReactElement, ReactNode } from 'react';
import { LayersControl, TileLayer } from 'react-leaflet';
import { CustomZoomControl } from './ZoomControl';
import { ResetViewControl } from './ResetViewControl';
import { MAP_BASE_LAYERS, MAP_CONSTANTS } from './mapConstants';

interface MapControlsProps {
  /** Overlays de `LayersControl` que requieren lógica propia del mapa. */
  children?: ReactNode;
}

export function MapControls({ children }: MapControlsProps): ReactElement {
  return (
    <>
      <CustomZoomControl
        position="topleft"
        zoomInText="+"
        zoomInTitle="Acercar"
        zoomOutText="−"
        zoomOutTitle="Alejar"
      />
      <ResetViewControl
        center={MAP_CONSTANTS.COLOMBIA_CENTER}
        zoom={MAP_CONSTANTS.DEFAULT_ZOOM}
        position="topleft"
        title="Centrar Mapa"
        label="🇨🇴"
      />

      <LayersControl position="topright">
        {MAP_BASE_LAYERS.map((layer) => (
          <LayersControl.BaseLayer
            key={layer.name}
            checked={layer.checked ?? false}
            name={layer.name}
          >
            <TileLayer attribution={layer.attribution} url={layer.url} />
          </LayersControl.BaseLayer>
        ))}
        {children}
      </LayersControl>
    </>
  );
}
