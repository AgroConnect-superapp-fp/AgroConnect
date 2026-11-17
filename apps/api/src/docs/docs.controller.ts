import { Controller, Get, Header, NotFoundException, Req } from '@nestjs/common';
import type { Request } from 'express';
import { generateHTML } from 'swagger-ui-express';
import { env } from '../shared/config/env';
import { resolveDocsBaseUrl, rewriteRelativeAssetUrls } from './docs-url';
import { OpenApiSource, type OpenApiDocument } from './openapi-source';

/**
 * CSP específica de la documentación.
 *
 * Helmet aplica por defecto `upgrade-insecure-requests`, que en desarrollo
 * (`http://localhost`) intenta cargar los assets por HTTPS y rompe la UI. Aquí
 * se fija una política equivalente pero sin esa directiva: todo se sirve desde
 * el mismo origen (`script-src 'self'`), sin CDN ni fuentes externas.
 */
const DOCS_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
].join('; ');

/**
 * Documentación interactiva de la API (contract-first, ADR-015).
 *
 * La documentación vive en la RAÍZ (`/docs`), excluida del prefijo global
 * `/api/v1`:
 *
 * - `GET /docs`             -> Swagger UI (assets locales de `swagger-ui-dist`).
 * - `GET /docs/openapi.json` -> contrato OpenAPI 3.1 real, leído del disco.
 *
 * En producción responde 404 salvo que `ENABLE_API_DOCS=true` esté explícito:
 * la documentación expone la superficie completa de la API.
 */
@Controller('docs')
export class DocsController {
  constructor(private readonly openApiSource: OpenApiSource) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Content-Security-Policy', DOCS_CONTENT_SECURITY_POLICY)
  @Header('Cache-Control', 'no-store')
  async ui(@Req() request: Request): Promise<string> {
    this.assertEnabled();

    const baseUrl = resolveDocsBaseUrl(request.originalUrl);
    const spec = await this.openApiSource.load();

    const html = generateHTML(spec, {
      swaggerOptions: { url: `${baseUrl}/openapi.json` },
      customSiteTitle: 'AgroConnect API — Documentación',
    });

    return rewriteRelativeAssetUrls(html, baseUrl);
  }

  @Get('openapi.json')
  @Header('Content-Type', 'application/json; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  async contract(): Promise<OpenApiDocument> {
    this.assertEnabled();
    return this.openApiSource.load();
  }

  private assertEnabled(): void {
    if (!env.ENABLE_API_DOCS) {
      throw new NotFoundException('La documentación de la API no está habilitada');
    }
  }
}
