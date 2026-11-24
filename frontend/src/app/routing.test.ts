import { describe, expect, it } from 'vitest';
import { legacyTokenTarget, parseRole, safeReturnTo } from './routing';

describe('parseRole', () => {
  it.each([
    'productor',
    'comprador_b2c',
    'comprador_b2b',
    'transportista',
    'administrador',
  ])('acepta el rol válido %s', (rol) => {
    expect(parseRole(rol)).toBe(rol);
  });

  it('usa productor cuando el parámetro falta', () => {
    expect(parseRole(null)).toBe('productor');
  });

  it('usa productor cuando el rol no existe', () => {
    expect(parseRole('superadmin')).toBe('productor');
  });
});

describe('safeReturnTo', () => {
  it('conserva una ruta interna con query', () => {
    expect(safeReturnTo('/moderacion?limit=10')).toBe('/moderacion?limit=10');
  });

  it('descarta URLs absolutas para evitar redirecciones abiertas', () => {
    expect(safeReturnTo('https://evil.example/login')).toBe('/panel');
  });

  it('descarta rutas protocol-relative', () => {
    expect(safeReturnTo('//evil.example')).toBe('/panel');
  });

  it('usa el fallback cuando el parámetro falta o está vacío', () => {
    expect(safeReturnTo(null)).toBe('/panel');
    expect(safeReturnTo('')).toBe('/panel');
  });

  it('permite un fallback personalizado', () => {
    expect(safeReturnTo(null, '/')).toBe('/');
  });
});

describe('legacyTokenTarget', () => {
  it('traduce resetToken al formulario de restablecimiento', () => {
    expect(legacyTokenTarget('?resetToken=abc123')).toBe('/reset?token=abc123');
  });

  it('traduce verifyToken a la verificación de correo', () => {
    expect(legacyTokenTarget('?verifyToken=xyz789')).toBe('/verificar?token=xyz789');
  });

  it('da prioridad a resetToken cuando llegan ambos', () => {
    expect(legacyTokenTarget('?verifyToken=xyz&resetToken=abc')).toBe('/reset?token=abc');
  });

  it('codifica tokens con caracteres especiales', () => {
    expect(legacyTokenTarget('?resetToken=a%20b%2Bc')).toBe('/reset?token=a%20b%2Bc');
  });

  it('devuelve null cuando no hay tokens heredados', () => {
    expect(legacyTokenTarget('')).toBeNull();
    expect(legacyTokenTarget('?foo=bar')).toBeNull();
  });
});
