import { Injectable, NotFoundException, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { serveFiles } from 'swagger-ui-express';
import { env } from '../shared/config/env';
import { resolveDocsBaseUrl } from './docs-url';
import { OpenApiSource } from './openapi-source';

/**
 * Sirve los assets locales de Swagger UI (`swagger-ui-dist`).
 *
 * Se monta con `forRoutes('docs')`. La documentación está excluida del prefijo
 * global `/api/v1`, así que el middleware queda en `/docs` (raíz). Express
 * reescribe `req.url` con la parte relativa de la ruta, por lo que
 * `express.static` resuelve `./swagger-ui.css`, `./swagger-ui-bundle.js` y
 * `./swagger-ui-init.js`.
 *
 * No hay CDN: los assets viajan con la aplicación (conexiones rurales lentas,
 * sin dependencia de terceros y sin fuga de la IP del usuario).
 */
@Injectable()
export class SwaggerAssetsMiddleware implements NestMiddleware {
  constructor(private readonly openApiSource: OpenApiSource) {}

  async use(request: Request, response: Response, next: NextFunction): Promise<void> {
    if (!env.ENABLE_API_DOCS) {
      next(new NotFoundException('La documentación de la API no está habilitada'));
      return;
    }

    // La raíz de la documentación la sirve el controller (HTML). Si se dejara
    // llegar a `express.static`, serve-static respondería 301 hacia
    // `/docs/` por su regla de "redirect at mount".
    const path = request.url.split('?')[0] ?? '';
    if (path === '' || path === '/') {
      next();
      return;
    }

    try {
      const spec = await this.openApiSource.load();
      const baseUrl = resolveDocsBaseUrl(request.originalUrl);

      const [initMiddleware, assetMiddleware] = serveFiles(spec, {
        swaggerOptions: { url: `${baseUrl}/openapi.json` },
      });

      initMiddleware(request, response, () => {
        assetMiddleware(request, response, next);
      });
    } catch (error) {
      next(error);
    }
  }
}
