import { describe, expect, it } from 'vitest';
import { getLqipUrl } from './cloudinary';

describe('getLqipUrl', () => {
  it('reduce imágenes de Unsplash con blur', () => {
    const url = getLqipUrl('https://images.unsplash.com/photo-123?w=800');

    expect(url).toContain('w=50');
    expect(url).toContain('q=10');
    expect(url).toContain('blur=40');
  });

  it('reduce miniaturas de Wikimedia a width=50', () => {
    const url = getLqipUrl(
      'https://commons.wikimedia.org/wiki/Special:FilePath/A.jpg?width=800'
    );

    expect(url).toContain('width=50');
  });

  it('transforma URLs directas de Cloudinary en el path', () => {
    const url = getLqipUrl(
      'https://res.cloudinary.com/demo/image/upload/v123/agro/a.jpg'
    );

    expect(url).toContain('/image/upload/w_50,q_10,f_auto/');
  });

  it('usa el preset lqip para public IDs', () => {
    const url = getLqipUrl('agroconnect/finca/cosecha');

    expect(url).toContain('w_50');
    expect(url).toContain('q_10');
  });

  it('deja igual las URLs de proveedores desconocidos', () => {
    expect(getLqipUrl('https://example.com/foto.jpg')).toBe(
      'https://example.com/foto.jpg'
    );
  });
});
