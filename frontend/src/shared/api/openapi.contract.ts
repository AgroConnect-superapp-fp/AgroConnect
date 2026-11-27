/**
 * Guard de contrato entre los tipos Zod de `@agroconnect/contracts` y el
 * OpenAPI generado.
 *
 * No hay cliente runtime: `apiClient` ya centraliza cookies httpOnly, refresh,
 * timeouts y el sobre `{ success, data, message }`. Lo que faltaba era una
 * verificación en compilación de que el spec y los tipos que consumen los
 * servicios siguen alineados. Si el generador cambia una forma, `tsc` falla.
 */
import type {
  PlotListResponse,
  Product,
  ProfileSnapshot,
  PublishProductInput,
} from '@agroconnect/contracts';
import type { paths } from './openapi';

type Assert<T extends true> = T;
type IsAssignable<From, To> = From extends To ? true : false;

type ProductsResponse =
  paths['/products']['get']['responses'][200]['content']['application/json'];
type ProfileResponse =
  paths['/profile/me']['get']['responses'][200]['content']['application/json'];
type PlotsResponse =
  paths['/plots']['get']['responses'][200]['content']['application/json'];
type PublishRequest =
  paths['/products']['post']['requestBody']['content']['application/json'];

export type ProductsContractMatches = Assert<
  IsAssignable<ProductsResponse['data'], Product[]>
>;
export type ProfileContractMatches = Assert<
  IsAssignable<ProfileResponse['data'], ProfileSnapshot>
>;
export type PlotsContractMatches = Assert<
  IsAssignable<PlotsResponse['data'], PlotListResponse>
>;
export type PublishRequestContractMatches = Assert<
  IsAssignable<PublishRequest, PublishProductInput>
>;
