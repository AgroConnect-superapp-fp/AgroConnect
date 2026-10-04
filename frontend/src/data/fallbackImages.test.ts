import { describe, expect, it } from 'vitest';
import { getCropFallbackImage } from './fallbackImages';
import { CROP_CATALOG } from '../types/property';

describe('getCropFallbackImage', () => {
  it('devuelve una URL https para cada cultivo del catálogo', () => {
    for (const crop of Object.keys(CROP_CATALOG)) {
      expect(getCropFallbackImage(crop)).toMatch(/^https:\/\//);
    }
  });

  it('usa la plantación de banano para banana', () => {
    expect(getCropFallbackImage('banana')).toContain('Magdalena%20zona%20bananera');
  });

  it('usa la imagen por defecto cuando el cultivo es desconocido o nulo', () => {
    expect(getCropFallbackImage('unknown-crop')).toContain('Blond%20and%20green%20rice');
    expect(getCropFallbackImage(null)).toContain('Special:FilePath');
    expect(getCropFallbackImage(undefined)).toContain('Special:FilePath');
  });
});
