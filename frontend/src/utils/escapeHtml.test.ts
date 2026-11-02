import { describe, expect, it } from 'vitest';
import { escapeHtml } from './escapeHtml';

describe('escapeHtml', () => {
  it('neutraliza etiquetas y atributos inyectados', () => {
    expect(escapeHtml('<img src=x onerror="alert(1)">')).toBe(
      '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
    );
  });

  it('conserva el texto sin caracteres especiales', () => {
    expect(escapeHtml('🌱 Finca El Mirador - Salento, Quindío')).toBe(
      '🌱 Finca El Mirador - Salento, Quindío'
    );
  });
});
