import type { Property } from '../../../types/property';
import { getCertificationInfo, getCropInfo } from '../../../types/property';
import { getCropFallbackImage } from '../../../data/fallbackImages';
import { resolveImageUrl } from '../../../services/cloudinary';
import { getContrastTextColor } from '../../../utils/colorContrast';
import { SafeImage } from '../../../components/ui/SafeImage';
import { Button, Card } from '../../../shared/ui';

interface ResultsListProps {
  properties: Property[];
  onSelect: (property: Property) => void;
}

/** Tarjetas del catálogo. Cada tarjeta expone un único botón de detalle. */
export function ResultsList({
  properties,
  onSelect,
}: ResultsListProps): React.ReactElement {
  return (
    <section className="mb-2 animate-fadeInUp delay-800">
      <h2 className="mb-4 text-left text-2xl font-bold text-agro-dark">
        📋 Productores Destacados
      </h2>
      <div className="flex flex-wrap justify-center gap-4">
        {properties.map((property, index) => {
          const cropInfo = getCropInfo(property.crop);
          const certificationInfo = getCertificationInfo(property.certification);
          const thumbnailUrl =
            property.images && property.images.length > 0
              ? typeof property.images[0] === 'string'
                ? property.images[0]
                : resolveImageUrl(property.images[0].publicId, 'medium')
              : null;
          const isPriority = index === 0;
          const delayClass = isPriority
            ? ''
            : `delay-${Math.min((index + 10) * 100, 1200)}`;

          return (
            <Card
              key={property.id}
              padding="none"
              className={`flex w-full flex-col overflow-hidden border-gray-100 transition-all hover:-translate-y-2 hover:shadow-xl md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-1rem)] ${
                isPriority ? '' : 'animate-fadeInUp'
              } ${delayClass}`}
            >
              {thumbnailUrl ? (
                <div className="group relative h-48 overflow-hidden bg-gray-100">
                  <SafeImage
                    src={thumbnailUrl}
                    fallbackSrc={getCropFallbackImage(property.crop)}
                    alt={property.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading={isPriority ? 'eager' : 'lazy'}
                    fetchPriority={isPriority ? 'high' : 'auto'}
                  />
                  <div className="absolute right-2 top-2">
                    <span
                      className="rounded-full px-2 py-1 text-xs font-semibold shadow-md transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: cropInfo.color,
                        color: getContrastTextColor(cropInfo.color),
                      }}
                    >
                      {cropInfo.emoji} {cropInfo.displayName}
                    </span>
                  </div>
                  {property.images && property.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white transition-colors group-hover:bg-black/80">
                      📷 {property.images.length} fotos
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-agro-green/10 to-agro-yellow/10">
                  <span className="text-6xl">{cropInfo.emoji}</span>
                  <div className="absolute right-2 top-2">
                    <span
                      className="rounded-full px-2 py-1 text-xs font-semibold shadow-md"
                      style={{
                        backgroundColor: cropInfo.color,
                        color: getContrastTextColor(cropInfo.color),
                      }}
                    >
                      {cropInfo.displayName}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-grow flex-col p-5">
                <h3 className="mb-3 text-lg font-bold text-agro-green">
                  {property.name}
                </h3>
                <div className="flex-grow space-y-2 text-sm text-gray-600">
                  <p>
                    👤 <strong>{property.owner}</strong>
                  </p>
                  <p>📍 {property.department}</p>
                  <p>📐 {property.area} hectáreas</p>
                  <p>
                    📈{' '}
                    <span
                      className={`font-bold ${
                        property.productivity >= 70
                          ? 'text-green-700'
                          : property.productivity >= 40
                            ? 'text-yellow-700'
                            : 'text-red-600'
                      }`}
                    >
                      {property.productivity}%
                    </span>
                  </p>
                  {certificationInfo ? (
                    <p>
                      {certificationInfo.emoji}{' '}
                      <span className="font-medium">{certificationInfo.displayName}</span>
                    </p>
                  ) : (
                    <p>
                      ⚪{' '}
                      <span className="font-medium text-gray-500">Sin Certificación</span>
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => onSelect(property)}
                  fullWidth
                  className="mt-4 py-2 text-sm"
                >
                  Ver Detalles y Fotos
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
