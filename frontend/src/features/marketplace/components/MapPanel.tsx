import { lazy, Suspense, useState, useSyncExternalStore } from 'react';
import type { Property } from '../../../types/property';
import { ErrorBoundary } from '../../../components/ui/ErrorBoundary';
import { Button } from '../../../shared/ui/Button';
import { FiltersPanel } from './FiltersPanel';

const PropertyMap = lazy(() =>
  import('../../../components/maps/PropertyMap').then((module) => ({
    default: module.PropertyMap,
  }))
);

function MapLoadingFallback(): React.ReactElement {
  return (
    <div className="flex h-[600px] w-full items-center justify-center rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-green-50">
      <div className="text-center">
        <div className="relative inline-block">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-agro-green/20 border-t-agro-green" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">
            🗺️
          </div>
        </div>
        <p className="mt-4 font-semibold text-gray-700">Cargando mapa interactivo...</p>
      </div>
    </div>
  );
}

function handleMapError(error: Error): void {
  console.error('[Marketplace] Error en el mapa:', error);
}

const MOBILE_QUERY = '(max-width: 767px)';

/**
 * En móvil el mapa se carga bajo demanda.
 *
 * Leaflet descarga tiles de OpenStreetMap de terceros; en 3G esos tiles
 * dominaban el LCP (4,45 s). El botón evita descargarlos hasta que el usuario
 * los necesita y mantiene el contenido above-the-fold como LCP. En escritorio
 * el mapa sigue cargándose automáticamente.
 */
function subscribeToViewport(onChange: () => void): () => void {
  const media = window.matchMedia(MOBILE_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function getViewportSnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function useIsMobile(): boolean {
  return useSyncExternalStore(subscribeToViewport, getViewportSnapshot, () => false);
}

function MapPlaceholder({ onLoad }: { onLoad: () => void }): React.ReactElement {
  return (
    <div className="flex h-[600px] w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-emerald-300 bg-gradient-to-br from-emerald-50 to-amber-50 p-6 text-center">
      <span aria-hidden="true" className="text-5xl">
        🗺️
      </span>
      <div>
        <p className="text-lg font-semibold text-agro-dark">Mapa interactivo</p>
        <p className="mt-1 max-w-md text-sm text-gray-600">
          Cárgalo cuando lo necesites. Así ahorras datos móviles y la página aparece más
          rápido en el campo.
        </p>
      </div>
      <Button onClick={onLoad}>Cargar mapa interactivo</Button>
    </div>
  );
}

interface MapPanelProps {
  properties: Property[];
  showProductiveZones: boolean;
  enableDrawing: boolean;
  onToggleProductiveZones: () => void;
  onToggleDrawing: () => void;
  onPolygonCreated: (coordinates: [number, number][]) => void;
}

/** Sección del mapa con sus controles; Leaflet se carga de forma diferida. */
export function MapPanel({
  properties,
  showProductiveZones,
  enableDrawing,
  onToggleProductiveZones,
  onToggleDrawing,
  onPolygonCreated,
}: MapPanelProps): React.ReactElement {
  const isMobile = useIsMobile();
  const [mapEnabled, setMapEnabled] = useState(false);
  const showMap = !isMobile || mapEnabled;

  return (
    <section className="group mb-20 animate-scaleIn rounded-2xl bg-white p-6 shadow-md delay-300 transition-all hover:-translate-y-1 hover:shadow-2xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="animate-fadeInLeft delay-400">
          <h2 className="text-2xl font-bold text-agro-dark transition-colors group-hover:text-agro-green">
            🗺️ Mapa Interactivo de Propiedades
          </h2>
          <p className="mt-1 text-sm text-gray-600 transition-colors group-hover:text-gray-800">
            Explora los cultivos de tu región de forma sencilla
          </p>
        </div>
        <FiltersPanel
          showProductiveZones={showProductiveZones}
          enableDrawing={enableDrawing}
          onToggleProductiveZones={onToggleProductiveZones}
          onToggleDrawing={onToggleDrawing}
        />
      </div>

      {showMap ? (
        <ErrorBoundary onError={handleMapError}>
          <Suspense fallback={<MapLoadingFallback />}>
            <PropertyMap
              properties={properties}
              showProductiveZones={showProductiveZones}
              enableDrawing={enableDrawing}
              onPolygonCreated={onPolygonCreated}
            />
          </Suspense>
        </ErrorBoundary>
      ) : (
        <MapPlaceholder onLoad={() => setMapEnabled(true)} />
      )}
    </section>
  );
}
