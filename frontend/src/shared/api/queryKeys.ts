import type {
  ListMyPlotsQuery,
  NearbyPlotsQuery,
  ProductsQuery,
} from '@agroconnect/contracts';

/**
 * Claves de caché de TanStack Query.
 *
 * Se centralizan para que la invalidación sea explícita y no dependa de
 * strings duplicados entre pantallas. El patrón es jerárquico: invalidar
 * `products.all` invalida listas y pendientes a la vez.
 */
export const queryKeys = {
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: Partial<ProductsQuery>) =>
      [...queryKeys.products.lists(), filters] as const,
    pendingRoot: () => [...queryKeys.products.all, 'pending'] as const,
    pending: (limit: number) => [...queryKeys.products.pendingRoot(), limit] as const,
  },
  profile: {
    all: ['profile'] as const,
    me: () => [...queryKeys.profile.all, 'me'] as const,
  },
  plots: {
    all: ['plots'] as const,
    lists: () => [...queryKeys.plots.all, 'list'] as const,
    list: (params: Partial<ListMyPlotsQuery>) =>
      [...queryKeys.plots.lists(), params] as const,
    nearby: (query: NearbyPlotsQuery) =>
      [...queryKeys.plots.all, 'nearby', query] as const,
  },
} as const;
