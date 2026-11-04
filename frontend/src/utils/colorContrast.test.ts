import { describe, expect, it } from 'vitest';
import { getContrastTextColor } from './colorContrast';

describe('getContrastTextColor', () => {
  it('usa texto blanco sobre fondos oscuros', () => {
    expect(getContrastTextColor('#8B4513')).toBe('#ffffff');
    expect(getContrastTextColor('#228B22')).toBe('#111827');
  });

  it('usa texto oscuro sobre fondos claros', () => {
    expect(getContrastTextColor('#FFD700')).toBe('#111827');
    expect(getContrastTextColor('#DAA520')).toBe('#111827');
    expect(getContrastTextColor('#fff')).toBe('#111827');
  });

  it('cae a texto oscuro con un color inválido', () => {
    expect(getContrastTextColor('no-es-color')).toBe('#111827');
  });
});
