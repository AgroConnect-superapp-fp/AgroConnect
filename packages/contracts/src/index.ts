/**
 * Punto de entrada de @agroconnect/contracts (ADR-015, contract-first).
 * Todo endpoint de AgroConnect nace aquí: esquemas Zod → tipos → OpenAPI 3.1.
 */
export * from './authSchemas';
export * from './plotSchemas';
export { buildOpenApiDocument, type OpenApiDocument } from './openapi';
