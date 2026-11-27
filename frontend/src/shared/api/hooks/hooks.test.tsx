// @vitest-environment jsdom
import type { Product, ProfileSnapshot } from '@agroconnect/contracts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getMyProfile } from '../../../services/profileApi';
import {
  fetchPendingProducts,
  fetchProducts,
  moderateProduct,
  publishProduct,
} from '../../../services/productsApi';
import { fetchMyPlots, fetchNearbyPlots } from '../../../services/plotsApi';
import { queryKeys } from '../queryKeys';
import { useNearbyPlots, usePlots } from './usePlots';
import { usePendingProducts, useModerateProduct } from './usePendingProducts';
import { useProfile } from './useProfile';
import { useProducts, usePublishProduct } from './useProducts';

vi.mock('../../../services/productsApi', () => ({
  fetchProducts: vi.fn(),
  fetchPendingProducts: vi.fn(),
  publishProduct: vi.fn(),
  moderateProduct: vi.fn(),
}));

vi.mock('../../../services/profileApi', () => ({
  getMyProfile: vi.fn(),
}));

vi.mock('../../../services/plotsApi', () => ({
  fetchMyPlots: vi.fn(),
  fetchNearbyPlots: vi.fn(),
}));

const product: Product = {
  id: 'p1',
  name: 'Café de prueba',
  owner: 'Finca La Esperanza',
  department: 'Quindío',
  municipality: 'Armenia',
  crop: 'coffee',
  area: 3,
  productivity: 80,
  moderationStatus: 'pending',
  lat: 4.53,
  lng: -75.68,
  images: [],
  coordinates: [
    [4.53, -75.68],
    [4.54, -75.68],
    [4.54, -75.67],
  ],
};

const profile: ProfileSnapshot = {
  usuario: {
    id: 'u1',
    nombre: 'Productor',
    correo: 'productor@test.local',
    rol: 'productor',
    estado: 'ACTIVO',
    verificado: true,
    fechaRegistro: '2026-01-01T00:00:00.000Z',
  },
};

function createTestClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function wrapperFor(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }): React.ReactElement {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('hooks de datos', () => {
  it('useProducts consulta el catálogo con los filtros recibidos', async () => {
    vi.mocked(fetchProducts).mockResolvedValue([product]);
    const client = createTestClient();

    const { result } = renderHook(() => useProducts({ crop: 'coffee', limit: 10 }), {
      wrapper: wrapperFor(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchProducts).toHaveBeenCalledWith({ crop: 'coffee', limit: 10 });
    expect(result.current.data).toEqual([product]);
  });

  it('usePendingProducts usa la cola sin caché reutilizable', async () => {
    vi.mocked(fetchPendingProducts).mockResolvedValue([product]);
    const client = createTestClient();

    const { result } = renderHook(() => usePendingProducts(20), {
      wrapper: wrapperFor(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchPendingProducts).toHaveBeenCalledWith(20);
    expect(result.current.data).toEqual([product]);
  });

  it('useProfile consulta el perfil de la sesión', async () => {
    vi.mocked(getMyProfile).mockResolvedValue(profile);
    const client = createTestClient();

    const { result } = renderHook(() => useProfile(), { wrapper: wrapperFor(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(profile);
  });

  it('usePlots consulta las parcelas propias con paginación', async () => {
    vi.mocked(fetchMyPlots).mockResolvedValue([]);
    const client = createTestClient();

    const { result } = renderHook(() => usePlots({ limit: 5, offset: 10 }), {
      wrapper: wrapperFor(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchMyPlots).toHaveBeenCalledWith({ limit: 5, offset: 10 });
  });

  it('useNearbyPlots no consulta mientras está deshabilitado', async () => {
    vi.mocked(fetchNearbyPlots).mockResolvedValue([]);
    const client = createTestClient();
    const query = { lat: 4.53, lng: -75.68, radius: 10 };

    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) => useNearbyPlots(query, enabled),
      { wrapper: wrapperFor(client), initialProps: { enabled: false } }
    );

    expect(fetchNearbyPlots).not.toHaveBeenCalled();
    expect(result.current.fetchStatus).toBe('idle');

    rerender({ enabled: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(fetchNearbyPlots).toHaveBeenCalledWith(query);
  });
});

describe('mutaciones e invalidación', () => {
  it('aprobar un producto invalida la cola pendiente y el catálogo', async () => {
    vi.mocked(moderateProduct).mockResolvedValue({
      ...product,
      moderationStatus: 'approved',
    });
    const client = createTestClient();
    client.setQueryData(queryKeys.products.pending(20), [product]);
    client.setQueryData(queryKeys.products.list({}), [product]);

    const { result } = renderHook(() => useModerateProduct(), {
      wrapper: wrapperFor(client),
    });

    await result.current.mutateAsync({ productId: 'p1', status: 'approved' });

    expect(moderateProduct).toHaveBeenCalledWith('p1', 'approved');
    expect(client.getQueryState(queryKeys.products.pending(20))?.isInvalidated).toBe(
      true
    );
    expect(client.getQueryState(queryKeys.products.list({}))?.isInvalidated).toBe(true);
  });

  it('publicar invalida catálogo y moderación', async () => {
    vi.mocked(publishProduct).mockResolvedValue(product);
    const client = createTestClient();
    client.setQueryData(queryKeys.products.pending(20), []);
    client.setQueryData(queryKeys.products.list({}), []);

    const { result } = renderHook(() => usePublishProduct(), {
      wrapper: wrapperFor(client),
    });

    await result.current.mutateAsync({
      payload: {
        name: 'Café de prueba',
        department: 'Quindío',
        municipality: 'Armenia',
        crop: 'coffee',
        area: 3,
        productivity: 80,
        lat: 4.53,
        lng: -75.68,
        images: [],
        coordinates: [
          [4.53, -75.68],
          [4.54, -75.68],
          [4.54, -75.67],
        ],
      },
    });

    expect(client.getQueryState(queryKeys.products.pending(20))?.isInvalidated).toBe(
      true
    );
    expect(client.getQueryState(queryKeys.products.list({}))?.isInvalidated).toBe(true);
  });
});
