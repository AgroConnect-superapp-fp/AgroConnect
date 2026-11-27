import type { Product } from '@agroconnect/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPendingProducts, moderateProduct } from '../../../services/productsApi';
import { queryKeys } from '../queryKeys';

const DEFAULT_PENDING_LIMIT = 20;

/**
 * Cola de moderación sin caché reutilizable (`staleTime` 0).
 *
 * Un moderador debe ver el estado real en cada visita: aprobar o rechazar
 * desde otra sesión no puede quedar oculto por datos viejos.
 */
export function usePendingProducts(limit = DEFAULT_PENDING_LIMIT) {
  return useQuery<Product[]>({
    queryKey: queryKeys.products.pending(limit),
    queryFn: () => fetchPendingProducts(limit),
    staleTime: 0,
  });
}

interface ModerateProductVariables {
  productId: string;
  status: 'approved' | 'rejected';
}

/**
 * Aprueba o rechaza un producto.
 *
 * Invalida la cola pendiente (el producto desaparece) y el catálogo (un
 * aprobado debe aparecer en el marketplace sin recargar la página).
 */
export function useModerateProduct() {
  const queryClient = useQueryClient();

  return useMutation<Product, Error, ModerateProductVariables>({
    mutationFn: ({ productId, status }) => moderateProduct(productId, status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.products.pendingRoot() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.products.lists() }),
      ]);
    },
  });
}
