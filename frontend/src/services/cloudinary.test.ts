// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './apiClient';
import {
  CLOUDINARY_CONFIG,
  getImageUrl,
  getLqipUrl,
  getResponsiveImageUrls,
  isDirectImageUrl,
  resolveImageUrl,
  uploadImage,
  validateImageFile,
} from './cloudinary';

vi.mock('./apiClient', () => ({
  apiRequest: vi.fn(),
}));

const mockApiRequest = vi.mocked(apiRequest);

const signature = {
  apiKey: 'key',
  timestamp: 123,
  signature: 'firma',
  folder: 'agroconnect/test',
  allowedFormats: ['jpg', 'png'],
  cloudName: 'demo',
};

class MockXhr {
  upload = new EventTarget();
  status = 200;
  responseText = JSON.stringify({ public_id: 'foto', secure_url: 'https://x' });
  private loadHandler?: () => void;
  private errorHandler?: () => void;
  open = vi.fn();
  abort = vi.fn();
  addEventListener = vi.fn((event: string, handler: () => void) => {
    if (event === 'load') this.loadHandler = handler;
    if (event === 'error') this.errorHandler = handler;
  });
  send = vi.fn(() => {
    this.loadHandler?.();
  });
  failNetwork = (): void => {
    this.errorHandler?.();
  };
}

describe('cloudinary URL helpers', () => {
  it('distingue URLs directas de public IDs', () => {
    expect(isDirectImageUrl('https://images.unsplash.com/a.jpg')).toBe(true);
    expect(isDirectImageUrl('//cdn.example.com/a.jpg')).toBe(true);
    expect(isDirectImageUrl('data:image/png;base64,abc')).toBe(true);
    expect(isDirectImageUrl('agroconnect/finca/cosecha')).toBe(false);
  });

  it('devuelve la URL directa sin transformarla', () => {
    const url = 'https://images.unsplash.com/a.jpg';
    expect(resolveImageUrl(url, 'medium')).toBe(url);
  });

  it('genera una URL de Cloudinary con el preset solicitado', () => {
    const url = getImageUrl('agroconnect/finca/cosecha', 'thumbnail');
    expect(url).toContain(
      `res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`
    );
    expect(url).toContain('w_200');
    expect(url).toContain('h_200');
    expect(getImageUrl('agroconnect/finca/cosecha', 'medium', 0)).not.toContain('r_');
  });

  it('genera variantes responsive y LQIP', () => {
    const responsive = getResponsiveImageUrls('agroconnect/finca/cosecha');
    expect(responsive.small).not.toBe(responsive.large);
    expect(responsive.lqip).toContain('w_50');

    const direct = 'https://images.unsplash.com/a.jpg?w=800';
    const directResponsive = getResponsiveImageUrls(direct);
    expect(directResponsive.small).toBe(direct);
    expect(directResponsive.lqip).toContain('w=50');
  });

  it('adapta LQIP por proveedor', () => {
    expect(getLqipUrl('https://images.unsplash.com/a.jpg')).toContain('blur=40');
    expect(getLqipUrl('https://upload.wikimedia.org/a.jpg?width=800')).toContain(
      'width=50'
    );
    expect(getLqipUrl('https://res.cloudinary.com/demo/image/upload/v1/a.jpg')).toContain(
      '/image/upload/w_50,q_10,f_auto/'
    );
    expect(getLqipUrl('https://example.com/a.jpg')).toBe('https://example.com/a.jpg');
    expect(getLqipUrl('no-es-url')).toContain('res.cloudinary.com');
  });
});

describe('validateImageFile', () => {
  class MockImage {
    naturalWidth = 800;
    naturalHeight = 600;
    onload?: () => void;
    onerror?: () => void;
    set src(_value: string) {
      queueMicrotask(() => this.onload?.());
    }
  }

  beforeEach(() => {
    vi.stubGlobal('Image', MockImage);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rechaza tipo y tamaño inválidos sin leer la imagen', async () => {
    await expect(
      validateImageFile(new File(['x'], 'a.gif', { type: 'image/gif' }))
    ).resolves.toMatchObject({ valid: false, error: expect.stringContaining('Tipo') });

    await expect(
      validateImageFile(
        new File([new Uint8Array(11 * 1024 * 1024)], 'a.jpg', { type: 'image/jpeg' })
      )
    ).resolves.toMatchObject({ valid: false, error: expect.stringContaining('grande') });
  });

  it('acepta una imagen con dimensiones suficientes', async () => {
    await expect(
      validateImageFile(new File(['x'], 'a.jpg', { type: 'image/jpeg' }))
    ).resolves.toEqual({ valid: true });
  });
});

describe('uploadImage', () => {
  beforeEach(() => {
    vi.stubGlobal('XMLHttpRequest', MockXhr);
    mockApiRequest.mockResolvedValue(signature);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('firma y sube la imagen', async () => {
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    await expect(uploadImage({ file })).resolves.toMatchObject({ public_id: 'foto' });
    expect(mockApiRequest).toHaveBeenCalledWith(
      '/api/v1/uploads/signature',
      { method: 'POST' },
      10_000
    );
  });

  it('propaga el fallo de firma', async () => {
    mockApiRequest.mockRejectedValueOnce(new Error('sin firma'));
    await expect(
      uploadImage({ file: new File(['x'], 'a.jpg', { type: 'image/jpeg' }) })
    ).rejects.toThrow('sin firma');
  });

  it('no inicia la subida si la señal ya está abortada', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      uploadImage({
        file: new File(['x'], 'a.jpg', { type: 'image/jpeg' }),
        signal: controller.signal,
      })
    ).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('no reintenta errores 4xx', async () => {
    class ErrorXhr extends MockXhr {
      override status = 400;
    }
    vi.stubGlobal('XMLHttpRequest', ErrorXhr);
    await expect(
      uploadImage({ file: new File(['x'], 'a.jpg', { type: 'image/jpeg' }) })
    ).rejects.toThrow('status 400');
  });
});
