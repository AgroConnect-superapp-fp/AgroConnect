/**
 * Estilos puros del mapa de propiedades.
 *
 * Extraídos de `PropertyMap.tsx` (ADR-017, Fase 1) sin cambios visuales:
 * la hoja de estilos scoped del wrapper, los estilos del popup y las
 * funciones de color de productividad.
 */

import type { CSSProperties } from 'react';
import { MAP_CONSTANTS } from './mapConstants';

/** Color del porcentaje de productividad según los rangos existentes. */
export function getProductivityColor(productivity: number): string {
  if (productivity >= 70) return '#16A34A';
  if (productivity >= 40) return '#CA8A04';
  return '#DC2626';
}

/** Gradiente de la barra de productividad según los rangos existentes. */
export function getProductivityGradient(productivity: number): string {
  if (productivity >= 70) return 'linear-gradient(90deg, #16A34A, #22C55E)';
  if (productivity >= 40) return 'linear-gradient(90deg, #CA8A04, #EAB308)';
  return 'linear-gradient(90deg, #DC2626, #EF4444)';
}

/**
 * Hoja de estilos scoped que antes vivía inline en `PropertyMap`.
 * Se mantiene idéntica, incluidos los nombres de clase dinámicos.
 */
export const MAP_STYLES_CSS = `

  /* ============================================ */
  /* LAYERS CONTROL - Minimal style override */
  /* ============================================ */
  .leaflet-control-layers {
    box-shadow: none !important;
    border: none !important;
  }

  /* ============================================ */
  /* ZOOM CONTROLS */
  /* ============================================ */
  .leaflet-control-zoom a {
    transition: all 0.3s ease !important;
  }

  .leaflet-control-zoom a:hover {
    background-color: #F97316 !important;
    color: #000000 !important;
    font-weight: bold !important;
  }

  /* ZOOM LOCK: Visual disable when popup is open */
  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS}[data-popup-open="true"] .leaflet-control-zoom a {
    opacity: 0.4 !important;
    cursor: not-allowed !important;
    pointer-events: none !important;
  }

  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS}[data-popup-open="true"] .leaflet-control-zoom a:hover {
    background-color: inherit !important;
    color: inherit !important;
  }

  /* ============================================ */
  /* DRAWING TOOLS */
  /* ============================================ */
  .leaflet-draw-toolbar a {
    transition: all 0.3s ease !important;
  }

  .leaflet-draw-toolbar a.leaflet-draw-draw-polygon:hover,
  .leaflet-draw-toolbar a.leaflet-draw-draw-rectangle:hover,
  .leaflet-draw-toolbar a.leaflet-draw-draw-marker:hover {
    background-color: #FACC15 !important;
    filter: none !important;
  }

  .leaflet-draw-toolbar a.leaflet-draw-edit-edit:hover,
  .leaflet-draw-toolbar a.leaflet-draw-edit-remove:hover {
    background-color: #EF4444 !important;
    filter: none !important;
  }

  .leaflet-draw-toolbar a:not(:hover) {
    filter: none !important;
  }

  /* ============================================ */
  /* SEARCH BANNER */
  /* ============================================ */
  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} {
    position: absolute !important;
    top: 16px !important;
    left: 50% !important;
    right: auto !important;
    transform: translateX(-50%) !important;
    width: 400px !important;
    min-width: 400px !important;
    max-width: 400px !important;
    z-index: 1000 !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
    display: block !important;
  }

  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS}[data-search-open="false"] .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} {
    display: none !important;
  }

  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} > a {
    display: none !important;
  }

  /* ============================================ */
  /* FORM */
  /* ============================================ */
  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} form {
    position: relative !important;
    display: flex !important;
    align-items: center !important;
    background: white !important;
    border: none !important;
    outline: none !important;
    border-radius: 8px !important;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08) !important;
    overflow: visible !important;
    width: 400px !important;
    min-width: 400px !important;
    max-width: 400px !important;
    box-sizing: border-box !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* ============================================ */
  /* INPUT */
  /* ============================================ */
  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} input {
    flex: 0 1 400px !important;
    width: 400px !important;
    min-width: 400px !important;
    max-width: 400px !important;
    padding: 10px 40px 10px 14px !important;
    border: none !important;
    outline: none !important;
    border-radius: 8px !important;
    font-size: 14px !important;
    background: transparent !important;
    color: #1B5E20 !important;
    font-family: inherit !important;
    box-sizing: border-box !important;
    margin: 0 !important;
  }

  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} input::placeholder {
    color: #6B7280 !important;
    font-style: italic !important;
  }

  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} input:focus {
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }

  /* Hide native reset button */
  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} form > button.reset {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
    position: absolute !important;
    left: -9999px !important;
  }

  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} form > button:not(.${MAP_CONSTANTS.CLOSE_BTN_CLASS}):not(.reset) {
    display: none !important;
  }

  /* ============================================ */
  /* INJECTED CLOSE BUTTON */
  /* ============================================ */
  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} form .${MAP_CONSTANTS.CLOSE_BTN_CLASS} {
    position: absolute !important;
    right: 10px !important;
    top: 50% !important;
    transform: translateY(-50%) !important;
    background: white !important;
    color: #6B7280 !important;
    border: 1px solid #e5e7eb !important;
    outline: none !important;
    width: 24px !important;
    height: 24px !important;
    border-radius: 50% !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: all 0.2s ease !important;
    padding: 0 !important;
    margin: 0 !important;
    font-size: 12px !important;
    font-weight: bold !important;
    line-height: 1 !important;
    font-family: inherit !important;
    z-index: 10 !important;
    flex-shrink: 0 !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
  }

  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} form .${MAP_CONSTANTS.CLOSE_BTN_CLASS}:hover {
    background: #EF4444 !important;
    color: white !important;
    border: 1px solid white !important;
    transform: translateY(-50%) scale(1.1) !important;
    box-shadow: 0 4px 8px rgba(239,68,68,0.3) !important;
  }

  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} form .${MAP_CONSTANTS.CLOSE_BTN_CLASS}:active {
    transform: translateY(-50%) scale(0.95) !important;
  }

  /* ============================================ */
  /* RESULTS DROPDOWN - AUTO HIDE WHEN EMPTY */
  /* ============================================ */
  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} .results {
    position: absolute !important;
    top: 100% !important;
    left: 0 !important;
    right: auto !important;
    width: 400px !important;
    min-width: 400px !important;
    max-width: 400px !important;
    background: white !important;
    border: none !important;
    border-radius: 0 0 8px 8px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1) !important;
    max-height: 300px !important;
    overflow-y: auto !important;
    margin-top: 2px !important;
    box-sizing: border-box !important;
    z-index: 1001 !important;
  }

  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} .results:empty {
    display: none !important;
    border: none !important;
    box-shadow: none !important;
    visibility: hidden !important;
    height: 0 !important;
    overflow: hidden !important;
  }

  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} .results:not(:empty) {
    border-top: 1px solid #E5E7EB !important;
  }

  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} .results > * {
    padding: 6px 14px !important;
    border-bottom: 1px solid #F3F4F6 !important;
    cursor: pointer !important;
    font-size: 13px !important;
    color: #374151 !important;
    transition: background 0.15s ease !important;
    background: white !important;
    line-height: 1.3 !important;
  }

  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} .results > *:hover {
    background: #F0FDF4 !important;
    color: #1B5E20 !important;
  }

  .${MAP_CONSTANTS.MAP_WRAPPER_CLASS} .${MAP_CONSTANTS.SEARCH_CONTROL_CSS_CLASS} .results > *:only-child {
    padding: 6px 14px !important;
    font-style: italic !important;
    color: #6B7280 !important;
    border-bottom: none !important;
    cursor: default !important;
  }

  /* ============================================ */
  /* TOGGLE BUTTON */
  /* ============================================ */
  .${MAP_CONSTANTS.TOGGLE_CONTROL_CLASS} {
    margin-top: 8px !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }

  .${MAP_CONSTANTS.TOGGLE_CONTROL_CLASS}.leaflet-bar,
  .${MAP_CONSTANTS.TOGGLE_CONTROL_CLASS} {
    box-shadow: none !important;
    border: none !important;
    background: transparent !important;
  }

  .${MAP_CONSTANTS.TOGGLE_CONTROL_CLASS} a {
    background: white !important;
    color: #2E7D32 !important;
    width: 42px !important;
    height: 42px !important;
    line-height: 40px !important;
    font-size: 26px !important;
    text-align: center !important;
    text-decoration: none !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    border: 0 !important;
    border-radius: 4px !important;
    cursor: pointer !important;
    transition: all 0.2s ease !important;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1) !important;
  }

  .${MAP_CONSTANTS.TOGGLE_CONTROL_CLASS} a:hover {
    background: #F0FDF4 !important;
    transform: scale(1.05) !important;
  }

  /* ============================================ */
  /* ATTRIBUTION */
  /* ============================================ */
  .leaflet-control-attribution {
    background: rgba(255, 255, 255, 0.85) !important;
    padding: 2px 6px !important;
    font-size: 11px !important;
    border-radius: 4px !important;
  }

  .leaflet-control-attribution a {
    color: #2E7D32 !important;
    text-decoration: none !important;
    font-weight: 500 !important;
  }

  .leaflet-control-attribution a:hover {
    text-decoration: underline !important;
    color: #1B5E20 !important;
  }

  /* ============================================ */
  /* POPUP - PREMIUM DESIGN WITH VISIBLE TIP */
  /* - Width: 520/450 (spacious for rich content)  */
  /* - Triangular tip (▲) visible, pointing to icon */
  /* ============================================ */
  @keyframes popupFadeIn {
    from { opacity: 0; transform: translateY(10px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes popupSlideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .leaflet-popup {
    animation: popupFadeIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) both;
  }

  .leaflet-popup-content-wrapper {
    border-radius: 12px !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15) !important;
    animation: popupSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
    padding: 0 !important;
    overflow: hidden !important;
  }

  /* TRIANGULAR TIP RESTORED - Premium UX pointing to icon */
  .leaflet-popup-tip-container {
    display: block !important;
    width: 40px !important;
    height: 12px !important;
    margin: 0 auto !important;
  }

  .leaflet-popup-tip {
    display: block !important;
    background: white !important;
    box-shadow: 0 3px 14px rgba(0,0,0,0.1) !important;
  }

  /* Popup content with proper spacing */
  .leaflet-popup-content {
    margin: 0 !important;
    padding: 0 !important;
    position: relative;
    width: auto !important;
  }

  .leaflet-popup-close-button {
    display: none !important;
  }

  @media (prefers-reduced-motion: reduce) {
    .leaflet-popup,
    .leaflet-popup-content-wrapper {
      animation: none !important;
    }
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .popup-gallery { animation: fadeInUp 0.4s ease-out 0.1s both; }
  .popup-header { animation: fadeInUp 0.4s ease-out 0.2s both; }
  .popup-details { animation: fadeInUp 0.4s ease-out 0.3s both; }
  .popup-coords { animation: fadeInUp 0.4s ease-out 0.4s both; }
`;

/** Estilos inline del contenido del popup, equivalentes al JSX original. */
export const popupStyles = {
  content: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    margin: 0,
    padding: 0,
  } satisfies CSSProperties,

  closeButton: {
    top: '10px',
    right: '10px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'white',
    border: '1px solid #e5e7eb',
    color: '#6B7280',
    fontSize: '12px',
    fontWeight: 'bold',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: 0,
  } satisfies CSSProperties,

  header: (hasImages: boolean): CSSProperties => ({
    padding: '16px 20px 12px 20px',
    background: hasImages
      ? 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(240,253,244,0.4) 100%)'
      : 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
    borderBottom: '1px solid #E5E7EB',
  }),

  polygonHeader: {
    padding: '16px 20px 12px 20px',
    background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
    borderBottom: '1px solid #E5E7EB',
  } satisfies CSSProperties,

  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
  } satisfies CSSProperties,

  titleColumn: {
    flex: 1,
    minWidth: 0,
  } satisfies CSSProperties,

  icon: (color: string): CSSProperties => ({
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    width: '48px',
    height: '48px',
    background: `linear-gradient(135deg, ${color} 0%, ${color}DD 100%)`,
    boxShadow: `0 4px 12px ${color}40`,
    fontSize: '24px',
  }),

  markerTitle: {
    margin: '0 0 2px 0',
    fontWeight: 700,
    lineHeight: 1.2,
    color: '#14532D',
    fontSize: '17px',
    letterSpacing: '-0.01em',
  } satisfies CSSProperties,

  title: {
    margin: 0,
    fontWeight: 700,
    lineHeight: 1.2,
    color: '#14532D',
    fontSize: '17px',
    letterSpacing: '-0.01em',
  } satisfies CSSProperties,

  subtitle: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 500,
    color: '#6B7280',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  } satisfies CSSProperties,

  galleryWrapper: {
    margin: 0,
  } satisfies CSSProperties,

  detailsGrid: {
    padding: '16px 20px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  } satisfies CSSProperties,

  card: {
    background: '#F9FAFB',
    padding: '10px 12px',
    borderRadius: '8px',
  } satisfies CSSProperties,

  cardFull: {
    background: '#F9FAFB',
    padding: '10px 12px',
    borderRadius: '8px',
    gridColumn: 'span 2',
  } satisfies CSSProperties,

  label: (marginBottom: string): CSSProperties => ({
    fontSize: '10px',
    fontWeight: 700,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom,
  }),

  value: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#111827',
  } satisfies CSSProperties,

  cropBadge: (color: string): CSSProperties => ({
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '999px',
    color: 'white',
    fontSize: '11px',
    fontWeight: 700,
    background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
    boxShadow: `0 2px 6px ${color}30`,
    letterSpacing: '0.02em',
  }),

  productivityRow: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } satisfies CSSProperties,

  productivityValue: (productivity: number): CSSProperties => ({
    fontSize: '14px',
    fontWeight: 800,
    color: getProductivityColor(productivity),
  }),

  progressTrack: {
    height: '6px',
    background: '#E5E7EB',
    borderRadius: '3px',
    overflow: 'hidden',
  } satisfies CSSProperties,

  progressBar: (productivity: number): CSSProperties => ({
    height: '100%',
    width: '100%',
    background: getProductivityGradient(productivity),
    borderRadius: '3px',
    transform: `scaleX(${productivity / 100})`,
    transformOrigin: 'left center',
    willChange: 'transform',
    transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
  }),

  certificationCard: {
    gridColumn: 'span 2',
    background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
    padding: '10px 12px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #FCD34D',
  } satisfies CSSProperties,

  certificationLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#92400E',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  } satisfies CSSProperties,

  certificationValue: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#78350F',
    textTransform: 'capitalize',
  } satisfies CSSProperties,

  coordinates: {
    padding: '10px 20px',
    background: '#F9FAFB',
    borderTop: '1px solid #E5E7EB',
    fontSize: '11px',
    color: '#6B7280',
    fontFamily: 'ui-monospace, SFMono-Regular, monospace',
    letterSpacing: '0.02em',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  } satisfies CSSProperties,
} as const;
