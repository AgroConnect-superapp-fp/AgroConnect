import { describe, expect, it } from 'vitest';
import { getImageCredit } from './imageCredits';
import { wikimediaImageUrl } from './wikimediaImage';

describe('getImageCredit', () => {
  it('devuelve autor y licencia para imágenes de Wikimedia', () => {
    const credit = getImageCredit(wikimediaImageUrl('Magdalena zona bananera.jpg'));

    expect(credit?.author).toBe('Claudia Marcela Bolaño Castro');
    expect(credit?.license).toBe('CC BY-SA 4.0');
    expect(credit?.sourceUrl).toContain('commons.wikimedia.org');
  });

  it('resuelve variantes de URL de Unsplash', () => {
    expect(
      getImageCredit('https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=800')
        ?.license
    ).toBe('Unsplash License');

    expect(
      getImageCredit(
        'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=70'
      )?.author
    ).toBe('Unsplash');
  });

  it('resuelve también la variante LQIP', () => {
    const lqip = wikimediaImageUrl('Sugarcane plantation 01.jpg', 50);

    expect(getImageCredit(lqip)?.author).toBe("Filo gèn'");
  });

  it('devuelve null para imágenes sin crédito registrado', () => {
    expect(getImageCredit('https://example.com/desconocida.jpg')).toBeNull();
  });
});
