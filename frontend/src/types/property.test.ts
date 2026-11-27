import { describe, expect, it } from 'vitest';
import {
  CROP_CATALOG,
  FALLBACK_CROP_INFO,
  getCertificationInfo,
  getCropInfo,
} from './property';

describe('getCropInfo', () => {
  it('devuelve el catálogo para un cultivo conocido', () => {
    expect(getCropInfo('coffee')).toBe(CROP_CATALOG.coffee);
  });

  it('usa el fallback para cultivo desconocido, nulo o vacío', () => {
    expect(getCropInfo('unknown')).toBe(FALLBACK_CROP_INFO);
    expect(getCropInfo(undefined)).toBe(FALLBACK_CROP_INFO);
    expect(getCropInfo(null)).toBe(FALLBACK_CROP_INFO);
  });
});

describe('getCertificationInfo', () => {
  it('devuelve la certificación conocida', () => {
    expect(getCertificationInfo('organic')).toMatchObject({ displayName: 'Orgánico' });
  });

  it('devuelve null para certificación desconocida o ausente', () => {
    expect(getCertificationInfo('unknown')).toBeNull();
    expect(getCertificationInfo(undefined)).toBeNull();
    expect(getCertificationInfo(null)).toBeNull();
  });
});
