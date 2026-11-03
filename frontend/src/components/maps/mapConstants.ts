/**
 * Constantes puras del mapa de propiedades.
 *
 * Extraídas de `PropertyMap.tsx` (ADR-017, Fase 1) sin cambios de valores:
 * configuración de la vista, capas base, rangos de productividad y gradiente
 * del heatmap.
 */

export const MAP_CONSTANTS = {
  COLOMBIA_CENTER: [4.5709, -74.2973] as [number, number],
  DEFAULT_ZOOM: 6,
  SEARCH_CONTROL_CSS_CLASS: 'leaflet-control-geosearch',
  MAP_WRAPPER_CLASS: 'agroconnect-map-wrapper',
  CLOSE_BTN_CLASS: 'agroconnect-close-btn',
  TOGGLE_CONTROL_CLASS: 'agroconnect-toggle-control',
  SEARCH_RESULT_ZOOM: 17,
  CLUSTER_DISABLE_ZOOM: 15,
  COORDINATE_TOLERANCE: 0.001,
} as const;

/**
 * Capas base del `LayersControl`, en el mismo orden y con la misma
 * atribución que el JSX original.
 */
export interface MapBaseLayer {
  readonly name: string;
  readonly attribution: string;
  readonly url: string;
  readonly checked?: boolean;
}

export const MAP_BASE_LAYERS: readonly MapBaseLayer[] = [
  {
    name: '🗺️ Estándar',
    checked: true,
    attribution:
      '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  {
    name: '🌾 Satélite',
    attribution:
      '© <a href="https://www.esri.com/" target="_blank" rel="noopener noreferrer">Esri</a>',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
  {
    name: '🏔️ Topográfico',
    attribution:
      '© <a href="https://opentopomap.org/" target="_blank" rel="noopener noreferrer">OpenTopoMap</a>',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  },
  {
    name: '🎨 Claro',
    attribution:
      '© <a href="https://carto.com/" target="_blank" rel="noopener noreferrer">CARTO</a>',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  },
];

/** Rangos de productividad de la leyenda (mismos colores y etiquetas). */
export interface ProductivityRange {
  readonly color: string;
  readonly label: string;
}

export const PRODUCTIVITY_LEGEND: readonly ProductivityRange[] = [
  { color: '#2E7D32', label: 'Baja' },
  { color: '#4CAF50', label: 'Media-baja' },
  { color: '#F9A825', label: 'Media-alta' },
  { color: '#FF9800', label: 'Alta' },
  { color: '#D84315', label: 'Muy alta' },
];

/** Gradiente del heatmap de zonas productivas. */
export const PRODUCTIVITY_HEAT_GRADIENT: Record<number, string> = {
  0.0: '#2E7D32',
  0.4: '#4CAF50',
  0.6: '#F9A825',
  0.8: '#FF9800',
  1.0: '#D84315',
};
