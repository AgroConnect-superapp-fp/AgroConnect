/**
 * Contenido del popup de una propiedad/parcela.
 *
 * Extraído de `PropertyMap.tsx` (ADR-017, Fase 1) sin cambios de texto,
 * estilos ni comportamiento. El popup de marcador conserva galería, badges,
 * tarjetas y botón de cierre; el de polígono conserva su variante compacta.
 *
 * Nota: el texto se renderiza con JSX (React escapa por defecto). El
 * `escapeHtml` del mapa sigue aplicándose en los resultados de búsqueda de
 * `leaflet-geosearch`, que sí usa `innerHTML`.
 */

import type { ReactElement } from 'react';
import { useCallback, useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { getCropFallbackImage } from '../../data/fallbackImages';
import type { Property } from '../../types/property';
import { getCropInfo } from '../../types/property';
import { ImageGallery } from '../ui/ImageGallery';
import { popupStyles } from './mapStyles';

interface PropertyPopupProps {
  property: Property;
  /** `marker` = popup rico del marcador; `polygon` = variante de parcela. */
  variant?: 'marker' | 'polygon';
}

/**
 * Botón de cierre del popup con soporte de tecla Escape.
 * Conserva el estilo unificado con el botón del buscador.
 */
function PopupCloseButton(): ReactElement {
  const map = useMap();

  const handleClose = useCallback(() => {
    map.closePopup();
  }, [map]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        map.closePopup();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [map]);

  return (
    <button
      onClick={handleClose}
      className="absolute z-20 transition-all duration-200"
      style={popupStyles.closeButton}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = '#EF4444';
        e.currentTarget.style.color = 'white';
        e.currentTarget.style.borderColor = 'white';
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(239,68,68,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'white';
        e.currentTarget.style.color = '#6B7280';
        e.currentTarget.style.borderColor = '#e5e7eb';
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
      aria-label="Cerrar popup"
    >
      ✕
    </button>
  );
}

/**
 * Popup de propiedad. No crea el `Popup` de Leaflet: solo su contenido,
 * para que el contenedor siga controlando props como `maxWidth`/`autoPan`.
 */
export function PropertyPopup({
  property,
  variant = 'marker',
}: PropertyPopupProps): ReactElement {
  const cropInfo = getCropInfo(property.crop);

  if (variant === 'polygon') {
    return (
      <div className="relative" style={popupStyles.content}>
        <PopupCloseButton />

        <div style={popupStyles.polygonHeader}>
          <div style={popupStyles.headerRow}>
            <div style={popupStyles.icon(cropInfo.color)}>{cropInfo.emoji}</div>
            <div style={popupStyles.titleColumn}>
              <div style={popupStyles.label('2px')}>Parcela</div>
              <h3 style={popupStyles.title}>{property.name}</h3>
            </div>
          </div>
        </div>

        <div style={popupStyles.detailsGrid}>
          <div style={popupStyles.card}>
            <div style={popupStyles.label('2px')}>📐 Área</div>
            <div style={popupStyles.value}>
              {property.area}{' '}
              <span style={{ color: '#6B7280', fontWeight: 500 }}>ha</span>
            </div>
          </div>

          <div style={popupStyles.card}>
            <div style={popupStyles.label('4px')}>🌱 Cultivo</div>
            <span style={popupStyles.cropBadge(cropInfo.color)}>
              {cropInfo.displayName}
            </span>
          </div>
        </div>

        <div style={popupStyles.coordinates}>
          <span>🎯</span>
          <span>
            {property.lat.toFixed(4)}°, {property.lng.toFixed(4)}°
          </span>
        </div>
      </div>
    );
  }

  const hasImages = Boolean(property.images && property.images.length > 0);

  return (
    <div className="relative" style={popupStyles.content}>
      <PopupCloseButton />

      <div className="popup-gallery">
        {hasImages && (
          <div style={popupStyles.galleryWrapper}>
            <ImageGallery
              images={property.images!}
              fallbackSrc={getCropFallbackImage(property.crop)}
              className="h-52"
            />
          </div>
        )}
      </div>

      <div className="popup-header" style={popupStyles.header(hasImages)}>
        <div style={popupStyles.headerRow}>
          <div style={popupStyles.icon(cropInfo.color)}>{cropInfo.emoji}</div>
          <div style={popupStyles.titleColumn}>
            <h3 style={popupStyles.markerTitle}>{property.name}</h3>
            <p style={popupStyles.subtitle}>
              <span>📍</span>
              <span>
                {property.municipality}, {property.department}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="popup-details" style={popupStyles.detailsGrid}>
        <div style={popupStyles.cardFull}>
          <div style={popupStyles.label('2px')}>👤 Propietario</div>
          <div style={popupStyles.value}>{property.owner}</div>
        </div>

        <div style={popupStyles.card}>
          <div style={popupStyles.label('4px')}>🌱 Cultivo</div>
          <span style={popupStyles.cropBadge(cropInfo.color)}>
            {cropInfo.displayName}
          </span>
        </div>

        <div style={popupStyles.card}>
          <div style={popupStyles.label('2px')}>📐 Área</div>
          <div style={popupStyles.value}>
            {property.area} <span style={{ color: '#6B7280', fontWeight: 500 }}>ha</span>
          </div>
        </div>

        <div style={popupStyles.cardFull}>
          <div style={popupStyles.productivityRow}>
            <span>📈 Productividad</span>
            <span style={popupStyles.productivityValue(property.productivity)}>
              {property.productivity}%
            </span>
          </div>
          <div style={popupStyles.progressTrack}>
            <div style={popupStyles.progressBar(property.productivity)} />
          </div>
        </div>

        {property.certification && (
          <div style={popupStyles.certificationCard}>
            <span style={{ fontSize: '16px' }}>✅</span>
            <div>
              <div style={popupStyles.certificationLabel}>Certificación</div>
              <div style={popupStyles.certificationValue}>
                {property.certification.replace('_', ' ')}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="popup-coords" style={popupStyles.coordinates}>
        <span>🎯</span>
        <span>
          {property.lat.toFixed(4)}°, {property.lng.toFixed(4)}°
        </span>
      </div>
    </div>
  );
}
