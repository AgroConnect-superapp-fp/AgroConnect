import { describe, expect, it } from 'vitest';
import { ApiError } from '../../services/apiClient';
import { createQueryClient } from './queryClient';

describe('createQueryClient', () => {
  const options = createQueryClient().getDefaultOptions().queries;
  const retry = options?.retry;

  it('reintenta solo errores de red y hasta dos veces', () => {
    expect(typeof retry).toBe('function');
    if (typeof retry !== 'function') return;

    const networkError = new ApiError(0, 'NETWORK_ERROR', 'Sin conexión');
    expect(retry(0, networkError)).toBe(true);
    expect(retry(1, networkError)).toBe(true);
    expect(retry(2, networkError)).toBe(false);
  });

  it('no reintenta errores de negocio', () => {
    if (typeof retry !== 'function') throw new Error('retry no es función');

    expect(retry(0, new ApiError(400, 'VALIDATION_ERROR', 'Datos inválidos'))).toBe(
      false
    );
    expect(retry(0, new ApiError(401, 'UNAUTHORIZED', 'Sesión expirada'))).toBe(false);
  });

  it('usa 400 ms entre reintentos para no demorar el fallback rural', () => {
    expect(options?.retryDelay).toBe(400);
    expect(options?.staleTime).toBe(0);
    expect(options?.refetchOnWindowFocus).toBe(false);
  });

  it('no reintenta mutaciones', () => {
    expect(createQueryClient().getDefaultOptions().mutations?.retry).toBe(false);
  });
});
