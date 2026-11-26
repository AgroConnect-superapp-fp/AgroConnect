import type {
  ListMyPlotsQuery,
  NearbyPlotListResponse,
  NearbyPlotsQuery,
  PlotListResponse,
} from '@agroconnect/contracts';
import { useQuery } from '@tanstack/react-query';
import { fetchMyPlots, fetchNearbyPlots } from '../../../services/plotsApi';
import { queryKeys } from '../queryKeys';

const PLOTS_STALE_TIME_MS = 30_000;

/** Parcelas propias del productor, paginadas por el servidor. */
export function usePlots(params: Partial<ListMyPlotsQuery> = {}) {
  return useQuery<PlotListResponse>({
    queryKey: queryKeys.plots.list(params),
    queryFn: () => fetchMyPlots(params),
    staleTime: PLOTS_STALE_TIME_MS,
  });
}

/**
 * Parcelas cercanas a un punto, con la distancia calculada por PostGIS.
 *
 * `enabled` permite esperar a tener coordenadas válidas sin disparar una
 * consulta con `NaN`. La clave incluye el radio: otro radio es otra búsqueda.
 */
export function useNearbyPlots(query: NearbyPlotsQuery, enabled = true) {
  return useQuery<NearbyPlotListResponse>({
    queryKey: queryKeys.plots.nearby(query),
    queryFn: () => fetchNearbyPlots(query),
    staleTime: PLOTS_STALE_TIME_MS,
    enabled,
  });
}
