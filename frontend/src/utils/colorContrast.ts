/**
 * Elige texto negro o blanco para un fondo hex según el contraste WCAG.
 *
 * Se usa en badges dinámicos (color por cultivo) donde una clase fija de
 * Tailwind no puede garantizar el contraste para todos los colores.
 */
export function getContrastTextColor(hex: string): '#111827' | '#ffffff' {
  const normalized = hex.replace('#', '');
  const expanded =
    normalized.length === 3
      ? normalized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : normalized;

  if (!/^[0-9a-f]{6}$/i.test(expanded)) {
    return '#111827';
  }

  const [r, g, b] = [0, 2, 4].map(
    (offset) => Number.parseInt(expanded.slice(offset, offset + 2), 16) / 255
  ) as [number, number, number];

  const linear = (channel: number): number =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

  const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
  const contrastWithWhite = 1.05 / (luminance + 0.05);
  const contrastWithBlack = (luminance + 0.05) / 0.05;

  return contrastWithWhite >= contrastWithBlack ? '#ffffff' : '#111827';
}
