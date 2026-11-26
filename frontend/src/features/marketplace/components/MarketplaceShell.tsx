import type { ReactNode } from 'react';
import type { Property } from '../../../types/property';
import { PropertyDetailModal } from '../../../components/ui/PropertyDetailModal';
import { MarketplaceFooter } from './MarketplaceFooter';
import { Skeleton } from '../../../shared/ui/Skeleton';

interface MarketplaceShellProps {
  properties: Property[];
  totalArea: number;
  avgProductivity: number;
  organicCount: number;
  usingMockData: boolean;
  /** Muestra esqueletos en los KPIs mientras llega el catálogo. */
  loading?: boolean;
  onRetry: () => void;
  selectedProperty: Property | null;
  onCloseProperty: () => void;
  onPropertyUpdated: (property: Property) => void;
  children: ReactNode;
}

const ANIMATION_STYLES = `
  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes softFloatIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulseGlowGreen {
    0%, 100% { box-shadow: 0 0 0 0 rgba(46, 125, 50, 0.4); }
    50% { box-shadow: 0 0 20px 5px rgba(46, 125, 50, 0.2); }
  }
  @keyframes pulseGlowBlue {
    0%, 100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
    50% { box-shadow: 0 0 20px 5px rgba(37, 99, 235, 0.2); }
  }
  .animate-fadeInDown { animation: fadeInDown 0.6s ease-out both; }
  .animate-fadeInUp { animation: fadeInUp 0.6s ease-out both; }
  .animate-fadeInLeft { animation: fadeInLeft 0.6s ease-out both; }
  .animate-scaleIn { animation: scaleIn 0.7s ease-out both; }
  .animate-slideInRight { animation: slideInRight 0.5s ease-out both; }
  .animate-soft-float-in { animation: softFloatIn 0.45s ease-out both; }
  .animate-pulseGlowGreen { animation: pulseGlowGreen 2s ease-in-out infinite; }
  .animate-pulseGlowBlue { animation: pulseGlowBlue 2s ease-in-out infinite; }
  .delay-100 { animation-delay: 0.1s; }
  .delay-200 { animation-delay: 0.2s; }
  .delay-300 { animation-delay: 0.3s; }
  .delay-400 { animation-delay: 0.4s; }
  .delay-500 { animation-delay: 0.5s; }
  .delay-600 { animation-delay: 0.6s; }
  .delay-700 { animation-delay: 0.7s; }
  .delay-800 { animation-delay: 0.8s; }
  .delay-900 { animation-delay: 0.9s; }
  .delay-1000 { animation-delay: 1.0s; }
  .delay-1100 { animation-delay: 1.1s; }
  .delay-1200 { animation-delay: 1.2s; }
  .interactive-transition { transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1); }
  @media (prefers-reduced-motion: reduce) {
    .animate-fadeInDown,
    .animate-fadeInUp,
    .animate-fadeInLeft,
    .animate-scaleIn,
    .animate-slideInRight,
    .animate-soft-float-in,
    .animate-pulseGlowGreen,
    .animate-pulseGlowBlue {
      animation: none !important;
      opacity: 1 !important;
      transform: none !important;
    }
  }
`;

/** Marco visual del marketplace: cabecera, KPIs, aviso demo, contenido y pie. */
export function MarketplaceShell({
  properties,
  totalArea,
  avgProductivity,
  organicCount,
  usingMockData,
  loading = false,
  onRetry,
  selectedProperty,
  onCloseProperty,
  onPropertyUpdated,
  children,
}: MarketplaceShellProps): React.ReactElement {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <style>{ANIMATION_STYLES}</style>

      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-2 text-4xl font-bold text-agro-green">
                🌱 AgroConnect
              </h1>
              <p className="mt-1 inline-block font-bold text-gray-600">
                Del productor al comprador, sin intermediarios
              </p>
            </div>
            <div className="flex flex-wrap justify-end gap-3">
              <div className="group flex h-28 w-36 animate-slideInRight animate-pulseGlowGreen cursor-default flex-col items-center justify-center rounded-lg border border-agro-green/30 bg-agro-green/10 p-3 text-center delay-200 transition-all hover:scale-110 hover:shadow-lg">
                <p className="text-xs font-semibold leading-tight text-agro-dark transition-colors group-hover:text-agro-green">
                  Propiedades
                  <br />
                  Activas
                </p>
                {loading ? (
                  <Skeleton className="mx-auto mt-2 h-8 w-12" />
                ) : (
                  <p className="mt-1 text-3xl font-bold text-agro-green">
                    {properties.length}
                  </p>
                )}
              </div>
              <div className="group flex h-28 w-36 animate-slideInRight cursor-default flex-col items-center justify-center rounded-lg border-2 border-agro-yellow/30 bg-agro-yellow/10 p-3 text-center delay-300 transition-all hover:scale-110 hover:border-agro-yellow hover:shadow-lg">
                <p className="text-xs font-semibold leading-tight text-gray-700 transition-colors group-hover:text-agro-yellow-ink">
                  Hectáreas
                </p>
                {loading ? (
                  <Skeleton className="mx-auto mt-2 h-8 w-16" />
                ) : (
                  <p className="mt-1 text-3xl font-bold text-agro-dark">
                    {totalArea.toFixed(1)}
                  </p>
                )}
              </div>
              <div className="group flex h-28 w-36 animate-slideInRight animate-pulseGlowBlue cursor-default flex-col items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-3 text-center delay-400 transition-all hover:scale-110 hover:shadow-lg">
                <p className="text-xs font-semibold leading-tight text-blue-800 transition-colors group-hover:text-blue-950">
                  Productividad
                </p>
                {loading ? (
                  <Skeleton className="mx-auto mt-2 h-8 w-12" />
                ) : (
                  <p className="mt-1 text-3xl font-bold text-blue-800">
                    {avgProductivity}%
                  </p>
                )}
              </div>
              <div className="group flex h-28 w-36 animate-slideInRight cursor-default flex-col items-center justify-center rounded-lg border-2 border-green-300 bg-green-50 p-3 text-center delay-500 transition-all hover:scale-110 hover:border-lime-400 hover:shadow-lg">
                <p className="text-xs font-semibold leading-tight text-green-700 transition-colors group-hover:text-lime-400">
                  Producción
                  <br />
                  Orgánica
                </p>
                {loading ? (
                  <Skeleton className="mx-auto mt-2 h-8 w-12" />
                ) : (
                  <p className="mt-1 text-3xl font-bold text-green-700">{organicCount}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {usingMockData && (
        <div className="mx-auto max-w-7xl px-6 pt-4">
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            <p>
              ⚠️ Mostrando <strong>datos de demostración</strong>: no se pudo conectar con
              el servicio de productos.
            </p>
            <button
              type="button"
              onClick={onRetry}
              className="min-h-10 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-800"
            >
              Reintentar conexión
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-6 pb-8 pt-20">{children}</main>

      <MarketplaceFooter />

      {selectedProperty && (
        <PropertyDetailModal
          property={selectedProperty}
          onClose={onCloseProperty}
          onPropertyUpdated={onPropertyUpdated}
        />
      )}
    </div>
  );
}
