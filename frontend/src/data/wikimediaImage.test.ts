import { describe, expect, it } from 'vitest';
import { wikimediaImageUrl } from './wikimediaImage';

describe('wikimediaImageUrl', () => {
  it('codifica espacios, apóstrofes y paréntesis', () => {
    const url = wikimediaImageUrl("Cacao fruit in Côte d'Ivoire (11).JPG");

    expect(url).toContain('Cacao%20fruit%20in%20C%C3%B4te%20d%27Ivoire%20%2811%29.JPG');
    expect(url).not.toMatch(/['()]/);
  });

  it('usa 800px por defecto y permite otro ancho', () => {
    expect(wikimediaImageUrl('A.jpg')).toBe(
      'https://commons.wikimedia.org/wiki/Special:FilePath/A.jpg?width=800'
    );
    expect(wikimediaImageUrl('A.jpg', 400)).toContain('?width=400');
  });
});
