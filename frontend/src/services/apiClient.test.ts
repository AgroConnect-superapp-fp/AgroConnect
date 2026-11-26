import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './apiClient';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renueva la sesión una vez ante 401 y reintenta la petición original', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(
        jsonResponse({ success: true, data: { usuario: { id: 'u1' } }, message: 'ok' })
      )
      .mockResolvedValueOnce(
        jsonResponse({ success: true, data: { id: 'product-1' }, message: 'ok' })
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/api/v1/products')).resolves.toEqual({ id: 'product-1' });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:4000/api/v1/products');
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'http://localhost:4000/api/v1/auth/refresh'
    );
    expect(fetchMock.mock.calls[2]?.[0]).toBe('http://localhost:4000/api/v1/products');
  });

  it('no envía Content-Type en GET para evitar preflight CORS', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ success: true, data: {}, message: 'ok' }));
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/api/v1/products');

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Headers;
    expect(headers.get('Content-Type')).toBeNull();
    expect(headers.get('X-Requested-With')).toBe('XMLHttpRequest');
  });

  it('no reintenta el propio refresh para evitar bucles', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(null, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiRequest('/api/v1/auth/refresh')).rejects.toMatchObject({
      status: 401,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('no anuncia sesión expirada si el refresh falla por red', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);
    const fakeWindow = new EventTarget();
    const onExpired = vi.fn();
    fakeWindow.addEventListener('agroconnect:session-expired', onExpired);
    vi.stubGlobal('window', fakeWindow);

    await expect(apiRequest('/api/v1/products')).rejects.toMatchObject({
      status: 401,
    });

    expect(onExpired).not.toHaveBeenCalled();
  });

  it('no anuncia sesión expirada si el refresh responde 5xx', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    const fakeWindow = new EventTarget();
    const onExpired = vi.fn();
    fakeWindow.addEventListener('agroconnect:session-expired', onExpired);
    vi.stubGlobal('window', fakeWindow);

    await expect(apiRequest('/api/v1/products')).rejects.toMatchObject({
      status: 401,
    });

    expect(onExpired).not.toHaveBeenCalled();
  });

  it('anuncia sesión expirada solo cuando el refresh rechaza la cookie', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    const fakeWindow = new EventTarget();
    const onExpired = vi.fn();
    fakeWindow.addEventListener('agroconnect:session-expired', onExpired);
    vi.stubGlobal('window', fakeWindow);

    await expect(apiRequest('/api/v1/products')).rejects.toMatchObject({
      status: 401,
    });

    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it('devuelve undefined en 204', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    );
    await expect(
      apiRequest('/api/v1/auth/logout', { method: 'POST' })
    ).resolves.toBeUndefined();
  });

  it('propaga el error de negocio del sobre', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Datos inválidos',
              details: ['x'],
            },
          },
          400
        )
      )
    );
    await expect(apiRequest('/api/v1/products')).rejects.toMatchObject({
      status: 400,
      code: 'VALIDATION_ERROR',
      details: ['x'],
    });
  });

  it('usa INTERNAL_ERROR si la respuesta falla sin sobre', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 500)));
    await expect(apiRequest('/api/v1/products')).rejects.toMatchObject({
      status: 500,
      code: 'INTERNAL_ERROR',
    });
  });

  it('usa INTERNAL_ERROR si la respuesta exitosa no trae data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ success: true })));
    await expect(apiRequest('/api/v1/products')).rejects.toMatchObject({
      status: 200,
      code: 'INTERNAL_ERROR',
    });
  });

  it('no intenta refresh en otras rutas de auth', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));
    vi.stubGlobal('fetch', fetchMock);
    await expect(apiRequest('/api/v1/auth/login')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('convierte el timeout en NETWORK_ERROR', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('aborted', 'AbortError'))
        );
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const expectation = expect(
      apiRequest('/api/v1/products', {}, 10)
    ).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
      message: expect.stringContaining('tardó demasiado'),
    });
    await vi.advanceTimersByTimeAsync(10);
    await expectation;
    vi.useRealTimers();
  });
});
