import type {
  ListMyPlotsQuery,
  NearbyPlotListResponse,
  NearbyPlotsQuery,
  PlotListResponse,
} from '@agroconnect/contracts';
import { apiRequest } from './apiClient';

const DEFAULT_LIMIT = 20;
const DEFAULT_OFFSET = 0;

/**
 * Parcelas del productor autenticado (`GET /api/v1/plots`).
 *
 * El servidor aplica paginación y devuelve solo las parcelas propias: el
 * `farmerId` nunca viaja desde el cliente (SPEC §12).
 */
export function fetchMyPlots(
  params: Partial<ListMyPlotsQuery> = {}
): Promise<PlotListResponse> {
  const limit = params.limit ?? DEFAULT_LIMIT;
  const offset = params.offset ?? DEFAULT_OFFSET;

  return apiRequest<PlotListResponse>(
    `/api/v1/plots?limit=${limit}&offset=${offset}`,
    {},
    15_000
  );
}

/**
 * Parcelas cercanas a un punto (`GET /api/v1/plots/nearby`).
 *
 * La distancia la calcula PostGIS en el servidor; el frontend solo muestra
 * `distanceKm` (SPEC §12: prohibido calcular distancias en JavaScript).
 */
export function fetchNearbyPlots(
  query: NearbyPlotsQuery
): Promise<NearbyPlotListResponse> {
  const params = new URLSearchParams({
    lat: String(query.lat),
    lng: String(query.lng),
    radius: String(query.radius),
  });

  return apiRequest<NearbyPlotListResponse>(
    `/api/v1/plots/nearby?${params.toString()}`,
    {},
    15_000
  );
}
