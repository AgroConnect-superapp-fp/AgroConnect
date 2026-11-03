import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@agroconnect/contracts';

vi.mock('./apiClient', () => ({
  apiRequest: vi.fn(),
}));

import { apiRequest } from './apiClient';
import { fetchProducts, searchProducts } from './productsApi';

const mockedRequest = vi.mocked(apiRequest);

const product: Product = {
  id: 'product-1',
  name: 'Finca La Esperanza',
  owner: 'Carlos Martínez',
  department: 'Cundinamarca',
  municipality: 'La Mesa',
  crop: 'coffee',
  area: 50,
  productivity: 85,
  certification: 'organic',
  lat: 4.6249,
  lng: -74.0679,
  images: [{ publicId: 'cld-sample-4', alt: 'Café' }],
  coordinates: [
    [4.62, -74.06],
    [4.63, -74.05],
  ],
  description: 'Finca cafetera',
  contact: '+57 300 000 00 00',
};

describe('productsApi', () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mapea el contrato de la API al modelo Property del frontend', async () => {
    mockedRequest.mockResolvedValue([product]);

    const properties = await fetchProducts();

    expect(mockedRequest).toHaveBeenCalledWith(
      '/api/v1/products?limit=100&offset=0',
      {},
      5_000
    );
    expect(properties).toEqual([
      expect.objectContaining({
        id: 'product-1',
        name: 'Finca La Esperanza',
        crop: 'coffee',
        area: 50,
        certification: 'organic',
        images: [{ publicId: 'cld-sample-4', alt: 'Café' }],
      }),
    ]);
  });

  it('envía búsqueda y filtros codificados en la query', async () => {
    mockedRequest.mockResolvedValue([]);

    await searchProducts('café del Quindío');

    expect(mockedRequest).toHaveBeenCalledWith(
      expect.stringContaining('search=caf%C3%A9+del+Quind%C3%ADo'),
      {},
      5_000
    );
  });

  it('devuelve [] si la API falla para activar el fallback demo', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockedRequest.mockRejectedValue(new Error('backend down'));

    await expect(fetchProducts()).resolves.toEqual([]);
  });
});
