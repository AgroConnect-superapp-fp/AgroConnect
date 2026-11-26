import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './apiClient';
import { getMyProfile, updateMyProfile } from './profileApi';

vi.mock('./apiClient', () => ({ apiRequest: vi.fn() }));

const mockApiRequest = vi.mocked(apiRequest);
const profile = { id: 'u-1', nombreCompleto: 'Ana' };

beforeEach(() => {
  mockApiRequest.mockReset();
  mockApiRequest.mockResolvedValue(profile);
});

describe('profileApi', () => {
  it('obtiene el perfil autenticado', async () => {
    await expect(getMyProfile()).resolves.toEqual(profile);
    expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/profile/me', {}, 20_000);
  });

  it('actualiza el perfil con PATCH y cuerpo JSON', async () => {
    const payload = { productor: { municipio: 'Armenia' } };
    await updateMyProfile(payload);
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/v1/profile/me',
      { method: 'PATCH', body: JSON.stringify(payload) },
      20_000
    );
  });
});
