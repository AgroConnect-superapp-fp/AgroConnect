/**
 * Utilidades de URL del módulo de documentación.
 *
 * Swagger UI genera HTML con referencias relativas a los assets (`./swagger-ui.css`).
 * La documentación vive en la RAÍZ (`/docs`), excluida del prefijo global
 * `/api/v1`: una referencia relativa se resolvería contra `/` en vez de
 * `/docs/`. Por eso el HTML se reescribe con la ruta base real, calculada a
 * partir de la petición.
 */

const DOCS_SEGMENT = '/docs';

/** Ruta usada si la petición no contiene el segmento `/docs`. */
const FALLBACK_DOCS_BASE_URL = '/docs';

/** Referencias relativas del HTML de swagger-ui-express: `"./swagger-ui.css"`. */
const RELATIVE_ASSET_REFERENCE = /(["'])\.\/([^"']+)\1/g;

/**
 * Calcula la ruta base del módulo de documentación a partir de la URL original.
 *
 * Ejemplos:
 *  - `/docs`                     -> `/docs`
 *  - `/docs/`                    -> `/docs`
 *  - `/docs/openapi.json`        -> `/docs`
 *  - `/docs/swagger-ui-init.js`  -> `/docs`
 */
export function resolveDocsBaseUrl(originalUrl: string): string {
  const path = originalUrl.split('?')[0] ?? '';
  const normalized = path.replace(/\/+$/, '');
  const index = normalized.indexOf(DOCS_SEGMENT);
  if (index < 0) {
    return FALLBACK_DOCS_BASE_URL;
  }

  const prefix = normalized.slice(0, index);
  const suffix = normalized.slice(index + DOCS_SEGMENT.length);

  // Solo se aceptan los dos montajes reales de la documentación. Cualquier
  // prefijo arbitrario se descarta para que no pueda reflejarse en el HTML
  // (XSS reflejado en la reescritura de assets).
  if (prefix !== '' && prefix !== '/api/v1') {
    return FALLBACK_DOCS_BASE_URL;
  }
  if (suffix !== '' && !suffix.startsWith('/')) {
    return FALLBACK_DOCS_BASE_URL;
  }

  return `${prefix}${DOCS_SEGMENT}`;
}

/**
 * Convierte las referencias relativas del HTML en absolutas respecto a `baseUrl`.
 * Solo se tocan atributos `src`/`href` con prefijo `./`, que en la plantilla de
 * swagger-ui-express son exclusivamente los assets locales de `swagger-ui-dist`.
 */
export function rewriteRelativeAssetUrls(html: string, baseUrl: string): string {
  return html.replace(
    RELATIVE_ASSET_REFERENCE,
    (_match: string, quote: string, asset: string) => `${quote}${baseUrl}/${asset}${quote}`,
  );
}
