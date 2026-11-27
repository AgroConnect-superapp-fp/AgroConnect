import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './apiClient';
import { fetchMyPlots, fetchNearbyPlots } from './plotsApi';

vi.mock('./apiClient', () => ({ apiRequest: vi.fn() }));

const mockApiRequest = vi.mocked(apiRequest);

beforeEach(() => {
  mockApiRequest.mockReset();
  mockApiRequest.mockResolvedValue({ plots: [], total: 0 });
});

describe('plotsApi', () => {
  it('lista las parcelas propias con paginación por defecto', async () => {
    await fetchMyPlots();
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/v1/plots?limit=20&offset=0',
      {},
      15_000
    );
  });

  it('respeta limit y offset personalizados', async () => {
    await fetchMyPlots({ limit: 5, offset: 10 });
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/v1/plots?limit=5&offset=10',
      {},
      15_000
    );
  });

  it('consulta parcelas cercanas con lat, lng y radio', async () => {
    await fetchNearbyPlots({ lat: 4.53, lng: -75.68, radius: 25 });
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/v1/plots/nearby?lat=4.53&lng=-75.68&radius=25',
      {},
      15_000
    );
  });
});
