import type { NearbyPlotResponse, PlotResponse } from '@agroconnect/contracts';
import type { Plot } from '../../domain/entities/Plot';

/**
 * Proyecta la entidad de dominio al DTO público de la parcela.
 *
 * La entidad guarda la geometría como objeto GeoJSON
 * (`{ type: 'Polygon', coordinates }`); el contrato compartido expone solo el
 * anillo de vértices (`[[[lng, lat], ...]]`), que es lo que consume el mapa.
 *
 * `centroid`, `boundary` y las marcas de tiempo pueden llegar `null`: la
 * columna `geom` es nullable en el esquema y el dominio no inventa datos.
 */
/**
 * Proyecta la parcela al DTO PÚBLICO de la búsqueda de proximidad.
 *
 * No expone `farmerId`, `boundary` ni `centroid`: son datos de la finca que un
 * comprador no necesita (SPEC §5). Sí expone `distanceKm`, que PostGIS ya
 * calcula con `ST_Distance` y es el dato principal de la búsqueda.
 */
export function toNearbyPlotResponse(plot: Plot): NearbyPlotResponse {
  return {
    id: plot.id,
    name: plot.name,
    areaHectares: plot.areaHectares,
    municipality: plot.municipality,
    department: plot.department,
    createdAt: plot.createdAt ? plot.createdAt.toISOString() : null,
    distanceKm: plot.distanceKm ?? 0,
  };
}

export function toPlotResponse(plot: Plot): PlotResponse {
  return {
    id: plot.id,
    name: plot.name,
    municipality: plot.municipality,
    department: plot.department,
    farmerId: plot.farmerId,
    areaHectares: plot.areaHectares,
    centroid: plot.centroid ? { ...plot.centroid } : null,
    boundary: plot.boundary
      ? plot.boundary.coordinates.map((ring) =>
          ring.map((vertex): [number, number] => {
            const [lng, lat] = vertex;
            return [lng, lat];
          }),
        )
      : null,
    createdAt: plot.createdAt ? plot.createdAt.toISOString() : null,
    updatedAt: plot.updatedAt ? plot.updatedAt.toISOString() : null,
  };
}
