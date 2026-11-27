import type { ProductsQuery, PublishProductInput } from '@agroconnect/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, publishProduct } from '../../../services/productsApi';
import type { Property } from '../../../types/property';
import { queryKeys } from '../queryKeys';

const CATALOG_STALE_TIME_MS = 30_000;

/**
 * Catálogo público del marketplace con caché compartida.
 *
 * `staleTime` de 30 s evita repetir la consulta al navegar entre mapa y
 * detalle, sin mostrar datos viejos por mucho tiempo en un catálogo vivo.
 */
export function useProducts(filters: Partial<ProductsQuery> = {}) {
  return useQuery<Property[]>({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => fetchProducts(filters),
    staleTime: CATALOG_STALE_TIME_MS,
  });
}

interface PublishProductVariables {
  payload: PublishProductInput;
}

/**
 * Publica una cosecha e invalida catálogo y cola de moderación.
 *
 * El producto nace pendiente: la cola de moderación debe reflejarlo de
 * inmediato y el catálogo público se refresca al volver a consultarse.
 */
export function usePublishProduct() {
  const queryClient = useQueryClient();

  return useMutation<Property, Error, PublishProductVariables>({
    mutationFn: ({ payload }) => publishProduct(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
}
