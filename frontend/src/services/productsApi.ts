import type { Product, ProductsQuery, PublishProductInput } from '@agroconnect/contracts';
import type { Property, PropertyImage } from '../types/property';
import { apiRequest } from './apiClient';

/**
 * Tiempo máximo para la consulta del marketplace.
 *
 * La API responde en milisegundos en condiciones normales. El límite evita
 * que un backend caído deje la UI en `LoadingScreen`; al vencer se devuelve
 * `[]` y `MarketplacePrototype` activa el fallback de datos demo.
 */
const PRODUCTS_TIMEOUT_MS = 5_000;
const DEFAULT_LIMIT = 100;

function toProperty(product: Product): Property {
  return {
    id: product.id,
    name: product.name,
    owner: product.owner,
    department: product.department,
    municipality: product.municipality,
    crop: product.crop as Property['crop'],
    area: product.area,
    productivity: product.productivity,
    certification: product.certification as Property['certification'],
    moderationStatus: product.moderationStatus,
    lat: product.lat,
    lng: product.lng,
    images: product.images,
    coordinates: product.coordinates,
    description:
      product.description ??
      `Propiedad en ${product.municipality}, ${product.department}`,
    contact: product.contact,
  };
}

/**
 * Lista los productos del marketplace desde `GET /api/v1/products`.
 *
 * Devuelve `[]` ante cualquier fallo para que el consumidor aplique el
 * fallback demo existente; no propaga el error porque el marketplace es una
 * vista pública y debe degradar con gracia.
 */
export async function fetchProducts(
  filters: Partial<ProductsQuery> = {}
): Promise<Property[]> {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.crop) params.set('crop', filters.crop);
  if (filters.department) params.set('department', filters.department);
  if (filters.municipality) params.set('municipality', filters.municipality);
  if (filters.certification) params.set('certification', filters.certification);
  params.set('limit', String(filters.limit ?? DEFAULT_LIMIT));
  params.set('offset', String(filters.offset ?? 0));

  try {
    const products = await apiRequest<Product[]>(
      `/api/v1/products?${params.toString()}`,
      {},
      PRODUCTS_TIMEOUT_MS
    );
    return products.map(toProperty);
  } catch (error) {
    console.error('[Products API] Error:', error);
    // La UI debe distinguir un catálogo vacío de una API caída. El fallback
    // demo solo se activa cuando esta promesa se rechaza.
    throw error;
  }
}

/**
 * Búsqueda por texto. Se conserva como API del servicio para cuando la UI
 * agregue un buscador; hoy el mapa usa `leaflet-geosearch` para lugares.
 */
export function searchProducts(query: string): Promise<Property[]> {
  return fetchProducts({ search: query, limit: DEFAULT_LIMIT });
}

/**
 * Publica un producto con la sesión cookie del productor.
 *
 * La subida de imágenes ocurre antes, desde el formulario, con el preset
 * unsigned de Cloudinary; aquí solo viajan los metadatos ya subidos.
 */
export async function updateProductImages(
  productId: string,
  images: PropertyImage[]
): Promise<Property> {
  const product = await apiRequest<Product>(
    `/api/v1/products/${productId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ images }),
    },
    15_000
  );

  return toProperty(product);
}

export async function publishProduct(payload: PublishProductInput): Promise<Property> {
  const product = await apiRequest<Product>(
    '/api/v1/products',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    15_000
  );

  return toProperty(product);
}

export function fetchPendingProducts(limit = 100): Promise<Product[]> {
  return apiRequest<Product[]>(`/api/v1/products/pending?limit=${limit}`, {}, 15_000);
}

export function moderateProduct(
  productId: string,
  status: 'approved' | 'rejected'
): Promise<Product> {
  return apiRequest<Product>(
    `/api/v1/products/${productId}/moderation`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    },
    15_000
  );
}
