/**
 * Composición del marketplace público.
 *
 * La navegación, el catálogo y la presentación viven separados: los datos
 * remotos pasan por TanStack Query (`useProducts`), el marco visual por
 * `MarketplaceShell` y cada sección por su componente en
 * `features/marketplace/components`.
 */

import { lazy, Suspense, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProducts } from './shared/api/hooks/useProducts';
import { queryKeys } from './shared/api/queryKeys';
import { devLog } from './utils/devLog';
import { MOCK_PROPERTIES } from './data/mockProperties';
import { EmptyState } from './shared/ui/EmptyState';
import { Button } from './shared/ui/Button';
import { Skeleton } from './shared/ui/Skeleton';
import type { Property } from './types/property';
import { MarketplaceShell } from './features/marketplace/components/MarketplaceShell';

// Secciones bajo el fold: se cargan después de la cabecera para no retrasar el LCP.
const MapPanel = lazy(() =>
  import('./features/marketplace/components/MapPanel').then((module) => ({
    default: module.MapPanel,
  }))
);
const CropDistribution = lazy(() =>
  import('./features/marketplace/components/CropDistribution').then((module) => ({
    default: module.CropDistribution,
  }))
);
const ResultsList = lazy(() =>
  import('./features/marketplace/components/ResultsList').then((module) => ({
    default: module.ResultsList,
  }))
);

function SectionFallback({
  label,
  height,
}: {
  label: string;
  height: string;
}): React.ReactElement {
  return (
    <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
      <Skeleton variant="rect" className={height} label={label} />
    </div>
  );
}

function MarketplaceLoading(): React.ReactElement {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <Skeleton
          variant="rect"
          className="h-[600px]"
          label="Cargando mapa y propiedades"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="rounded-2xl bg-white p-4 shadow-sm">
            <Skeleton variant="rect" className="mb-4 h-40" />
            <Skeleton className="mb-2 h-5 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function App(): React.ReactElement {
  const { data, isLoading, isError, refetch } = useProducts();
  const queryClient = useQueryClient();

  const [showProductiveZones, setShowProductiveZones] = useState(true);
  const [enableDrawing, setEnableDrawing] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Property>>({});

  const usingMockData = isError;
  const properties = useMemo(() => {
    const source = usingMockData ? MOCK_PROPERTIES : (data ?? []);
    return source.map((property) => overrides[property.id] ?? property);
  }, [data, overrides, usingMockData]);

  const totalArea = useMemo(
    () => properties.reduce((acc, property) => acc + property.area, 0),
    [properties]
  );

  const avgProductivity = useMemo(
    () =>
      properties.length > 0
        ? Math.round(
            properties.reduce((acc, property) => acc + property.productivity, 0) /
              properties.length
          )
        : 0,
    [properties]
  );

  const organicCount = useMemo(
    () => properties.filter((property) => property.certification === 'organic').length,
    [properties]
  );

  const handlePropertyUpdated = (updated: Property): void => {
    setOverrides((current) => ({ ...current, [updated.id]: updated }));
    queryClient.setQueryData<Property[]>(queryKeys.products.list({}), (current) =>
      current?.map((property) => (property.id === updated.id ? updated : property))
    );
    setSelectedProperty(updated);
  };

  if (isLoading) {
    return (
      <MarketplaceShell
        properties={[]}
        totalArea={0}
        avgProductivity={0}
        organicCount={0}
        usingMockData={false}
        loading
        onRetry={() => void refetch()}
        selectedProperty={null}
        onCloseProperty={() => undefined}
        onPropertyUpdated={handlePropertyUpdated}
      >
        <MarketplaceLoading />
      </MarketplaceShell>
    );
  }

  if (!usingMockData && properties.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-green-50 p-6">
        <div className="w-full max-w-md">
          <EmptyState
            title="No hay propiedades registradas"
            description="La API está conectada pero no contiene productos. Ejecuta el seed de desarrollo para cargar las propiedades de ejemplo."
            action={<Button onClick={() => void refetch()}>🔄 Recargar datos</Button>}
          />
        </div>
      </div>
    );
  }

  return (
    <MarketplaceShell
      properties={properties}
      totalArea={totalArea}
      avgProductivity={avgProductivity}
      organicCount={organicCount}
      usingMockData={usingMockData}
      onRetry={() => void refetch()}
      selectedProperty={selectedProperty}
      onCloseProperty={() => setSelectedProperty(null)}
      onPropertyUpdated={handlePropertyUpdated}
    >
      <Suspense fallback={<SectionFallback label="Cargando mapa" height="h-[600px]" />}>
        <MapPanel
          properties={properties}
          showProductiveZones={showProductiveZones}
          enableDrawing={enableDrawing}
          onToggleProductiveZones={() => setShowProductiveZones((value) => !value)}
          onToggleDrawing={() => setEnableDrawing((value) => !value)}
          onPolygonCreated={(coordinates) => {
            devLog('[Marketplace] Nueva parcela dibujada:', coordinates);
          }}
        />
      </Suspense>
      <Suspense
        fallback={<SectionFallback label="Cargando distribución" height="h-48" />}
      >
        <CropDistribution properties={properties} />
      </Suspense>
      <Suspense fallback={<SectionFallback label="Cargando productores" height="h-64" />}>
        <ResultsList properties={properties} onSelect={setSelectedProperty} />
      </Suspense>
    </MarketplaceShell>
  );
}

export default App;
