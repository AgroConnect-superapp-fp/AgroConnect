/**
 * Logger de desarrollo para el frontend.
 *
 * `import.meta.env.DEV` lo reemplaza Vite por `false` en el build de
 * producción, así que estas trazas desaparecen del bundle y no filtran
 * nombres de fincas, coordenadas ni términos de búsqueda a la consola.
 */
export function devLog(...args: unknown[]): void {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console -- logger de desarrollo, eliminado por Vite en producción
    console.log(...args);
  }
}
