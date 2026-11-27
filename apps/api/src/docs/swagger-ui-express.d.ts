/**
 * Tipos locales de `swagger-ui-express`.
 *
 * El paquete no publica tipos propios y no se añade `@types/swagger-ui-express`
 * (una dependencia externa más para una API de tres funciones). Se declara
 * únicamente la superficie que usa AgroConnect.
 *
 * Debe ser un script global (sin import/export de nivel superior).
 */
declare module 'swagger-ui-express' {
  import type { RequestHandler } from 'express';

  interface SwaggerUiOptions {
    swaggerOptions?: Record<string, unknown>;
    swaggerUrl?: string;
    swaggerUrls?: Record<string, string>;
    customCss?: string;
    customCssUrl?: string;
    customJs?: string;
    customJsStr?: string;
    customSiteTitle?: string;
    customfavIcon?: string;
    customRobots?: string;
    explorer?: boolean;
  }

  function generateHTML(swaggerDoc?: unknown, opts?: SwaggerUiOptions): string;
  function setup(swaggerDoc?: unknown, opts?: SwaggerUiOptions): RequestHandler;
  function serveFiles(
    swaggerDoc?: unknown,
    opts?: SwaggerUiOptions,
  ): [RequestHandler, RequestHandler];
  function serveWithOptions(options?: Record<string, unknown>): [RequestHandler, RequestHandler];
  const serve: [RequestHandler, RequestHandler];
}
