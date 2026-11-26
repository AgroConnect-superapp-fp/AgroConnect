import { useMemo } from 'react';
import { getCropInfo } from '../../../types/property';
import type { Property } from '../../../types/property';

interface CropDistributionProps {
  properties: Property[];
}

/** Distribución agregada por cultivo, calculada en el cliente sobre el catálogo. */
export function CropDistribution({
  properties,
}: CropDistributionProps): React.ReactElement | null {
  const cropCounts = useMemo(
    () =>
      properties.reduce<Record<string, number>>((acc, property) => {
        acc[property.crop] = (acc[property.crop] || 0) + 1;
        return acc;
      }, {}),
    [properties]
  );

  const topCrops = useMemo(() => {
    const counts = Object.values(cropCounts);
    if (counts.length === 0) return [];
    const maxCount = Math.max(...counts);
    return Object.entries(cropCounts)
      .filter(([, count]) => count === maxCount)
      .map(([crop]) => crop);
  }, [cropCounts]);

  if (properties.length === 0) return null;

  return (
    <section className="mb-20 animate-fadeInUp delay-500">
      <h2 className="mb-4 animate-fadeInLeft text-left text-2xl font-bold text-agro-dark delay-600">
        🌾 Distribución por Tipo de Cultivo
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Object.entries(cropCounts).map(([crop, count], index) => {
          const info = getCropInfo(crop);
          const isTopCrop = topCrops.includes(crop);
          const delayClass = `delay-${(index + 7) * 100}`;

          return (
            <div
              key={crop}
              className={`group relative flex animate-fadeInUp items-center gap-3 overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-1 hover:scale-105 hover:shadow-xl ${delayClass}`}
              style={{
                borderColor: `${info.color}55`,
                animation: isTopCrop
                  ? `pulseGlow_${crop.replace(/\s+/g, '_')} 2s ease-in-out infinite, fadeInUp 0.6s ease-out both`
                  : undefined,
                animationDelay: isTopCrop ? `0s, ${(index + 7) * 0.1}s` : undefined,
              }}
            >
              {isTopCrop && (
                <style>{`
                  @keyframes pulseGlow_${crop.replace(/\s+/g, '_')} {
                    0%, 100% { box-shadow: 0 0 0 0 ${info.color}40; }
                    50% { box-shadow: 0 0 20px 5px ${info.color}30; }
                  }
                `}</style>
              )}

              <span className="text-3xl transition-transform group-hover:rotate-12 group-hover:scale-125">
                {info.emoji}
              </span>
              <div>
                <p className="text-xs text-gray-500 transition-colors group-hover:text-agro-green">
                  {info.displayName}
                </p>
                <p className="text-xl font-bold text-gray-800 transition-colors group-hover:text-agro-dark">
                  {count} {count === 1 ? 'finca' : 'fincas'}
                </p>
              </div>

              {isTopCrop && (
                <div className="absolute right-2 top-2 animate-soft-float-in rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-2 py-1 text-xs font-bold text-amber-950 shadow-md">
                  ⭐ Top
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
