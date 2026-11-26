/**
 * Composición del marketplace público.
 *
 * La navegación, el catálogo y la presentación viven separados: los datos
 * remotos pasan por TanStack Query (`useProducts`), el marco visual por
 * `MarketplaceShell` y cada sección por su componente en
 * `features/marketplace/components`.
 */

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProducts } from './shared/api/hooks/useProducts';
import { queryKeys } from './shared/api/queryKeys';
import { devLog } from './utils/devLog';
import { MOCK_PROPERTIES } from './data/mockProperties';
import { EmptyState } from './shared/ui/EmptyState';
import { Button } from './shared/ui/Button';
import type { Property } from './types/property';
import { MarketplaceShell } from './features/marketplace/components/MarketplaceShell';
import { MapPanel } from './features/marketplace/components/MapPanel';
import { CropDistribution } from './features/marketplace/components/CropDistribution';
import { ResultsList } from './features/marketplace/components/ResultsList';

function LoadingScreen(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-green-50">
      <div className="animate-fadeInUp text-center">
        <div className="relative mb-6 inline-block">
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-agro-green/20 border-t-agro-green" />
          <div className="absolute inset-0 flex items-center justify-center text-3xl">
            🌱
          </div>
        </div>
        <h2 className="mb-2 text-2xl font-bold text-agro-dark">AgroConnect</h2>
        <p className="mb-1 font-medium text-gray-600">
          Conectando con el servicio de productos
        </p>
        <p className="text-sm text-gray-500">
          Cargando propiedades agrícolas desde la API...
        </p>
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
    return <LoadingScreen />;
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
      <CropDistribution properties={properties} />
      <ResultsList properties={properties} onSelect={setSelectedProperty} />
    </MarketplaceShell>
  );
}

export default App;
