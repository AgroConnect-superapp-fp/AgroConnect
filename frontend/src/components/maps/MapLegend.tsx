/**
 * Leyenda del mapa de propiedades.
 *
 * Extraída de `PropertyMap.tsx` (ADR-017, Fase 1). Mantiene el mismo
 * `L.Control`, la misma posición, los mismos textos y los mismos colores.
 */

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from '../../lib/leaflet';
import { CROP_CATALOG } from '../../types/property';
import { PRODUCTIVITY_LEGEND } from './mapConstants';

export function MapLegend(): null {
  const map = useMap();

  useEffect(() => {
    const LegendControl = L.Control.extend({
      onAdd() {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.cssText = `
          background: white; padding: 12px 16px; border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15); font-size: 12px;
          line-height: 1.6; max-width: 200px;
        `;
        div.innerHTML = `
          <h4 style="margin: 0 0 8px 0; color: #2E7D32; font-size: 14px; border-bottom: 2px solid #4CAF50; padding-bottom: 4px;">
            🌱 Tipos de Cultivo
          </h4>
          ${Object.entries(CROP_CATALOG)
            .map(
              ([, info]) => `
              <div style="display: flex; align-items: center; gap: 6px; margin: 2px 0;">
                <span style="font-size: 16px;">${info.emoji}</span>
                <span style="color: #333;">${info.displayName}</span>
              </div>
            `
            )
            .join('')}
          <div style="margin-top: 10px; padding-top: 8px; border-top: 2px solid #4CAF50;">
            <h4 style="margin: 0 0 8px 0; color: #2E7D32; font-size: 14px;">
              🎯 Productividad
            </h4>
            <div style="display: flex; gap: 2px; margin-top: 4px;">
              ${PRODUCTIVITY_LEGEND.map(
                (range) =>
                  `<div style="width: 20px; height: 12px; background: ${range.color};" title="${range.label}"></div>`
              ).join('')}
            </div>
          </div>
        `;
        return div;
      },
    });

    const legend = new LegendControl({ position: 'bottomright' });
    legend.addTo(map);

    return () => {
      legend.remove();
    };
  }, [map]);

  return null;
}
