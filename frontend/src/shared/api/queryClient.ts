import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../../services/apiClient';

const MAX_NETWORK_RETRIES = 2;

/**
 * Reintenta solo fallos de red o timeout, nunca errores de negocio.
 *
 * Un `400`, `401` o `422` no mejora al repetirse y multiplicaría la carga del
 * servidor; un `NETWORK_ERROR` (status 0) sí puede deberse a una conexión
 * rural intermitente, que es el caso real de AgroConnect.
 */
function shouldRetry(failureCount: number, error: Error): boolean {
  const isNetworkError = error instanceof ApiError && error.status === 0;
  return isNetworkError && failureCount < MAX_NETWORK_RETRIES;
}

/**
 * Cliente único de caché para la aplicación.
 *
 * `staleTime` base es 0: cada hook declara su vigencia (30 s catálogo, 0
 * moderación). El cliente solo aplica políticas transversales.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export const queryClient = createQueryClient();
