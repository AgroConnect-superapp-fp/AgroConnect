/**
 * Hook de dibujo de parcelas.
 *
 * Mantiene una única puerta de entrada a `useLeafletDraw` para que el
 * contenedor no conozca los detalles del plugin y para poder sustituir la
 * implementación sin tocar el layout.
 */

import { useLeafletDraw, type UseLeafletDrawProps } from './useLeafletDraw';

export function useMapDrawing(options: UseLeafletDrawProps): void {
  useLeafletDraw(options);
}
