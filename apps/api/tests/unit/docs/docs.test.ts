import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import type { Server } from 'node:http';
import { NotFoundException } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { serveFiles } from 'swagger-ui-express';
import { DocsController } from '../../../src/docs/docs.controller';
import { SwaggerAssetsMiddleware } from '../../../src/docs/swagger-assets.middleware';
import { OpenApiSource } from '../../../src/docs/openapi-source';
import { resolveDocsBaseUrl, rewriteRelativeAssetUrls } from '../../../src/docs/docs-url';
import { env } from '../../../src/shared/config/env';

/**
 * Pruebas unitarias del módulo de documentación de la API (ADR-015).
 *
 * No hay red: el HTML de Swagger UI se genera en memoria y el contrato
 * OpenAPI se inyecta con un doble. Solo el filesystem se sustituye para
 * ejercitar el lector de contrato (`OpenApiSource`).
 */
jest.mock('node:fs', () => ({
  ...jest.requireActual<typeof import('node:fs')>('node:fs'),
  existsSync: jest.fn(),
}));

jest.mock('node:fs/promises', () => ({
  ...jest.requireActual<typeof import('node:fs/promises')>('node:fs/promises'),
  readFile: jest.fn(),
}));

jest.mock('swagger-ui-express', () => ({
  ...jest.requireActual<typeof import('swagger-ui-express')>('swagger-ui-express'),
  serveFiles: jest.fn(),
}));

const existsSyncMock = existsSync as unknown as jest.Mock;
const readFileMock = readFile as unknown as jest.Mock;
const serveFilesMock = serveFiles as unknown as jest.Mock;

const ENABLE_API_DOCS_ORIGINAL = env.ENABLE_API_DOCS;

const CONTRATO = {
  openapi: '3.1.0',
  info: { title: 'AgroConnect API', version: '1.0.0' },
  paths: {
    '/api/v1/health': {
      get: { responses: { '200': { description: 'Servicio disponible' } } },
    },
  },
};

const CSP_ESPERADA = [
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

afterAll(() => {
  env.ENABLE_API_DOCS = ENABLE_API_DOCS_ORIGINAL;
});

describe('docs-url: resolveDocsBaseUrl', () => {
  it.each([
    ['/docs', '/docs'],
    ['/docs/', '/docs'],
    ['/docs/openapi.json', '/docs'],
    ['/docs/swagger-ui-init.js', '/docs'],
    ['/docs?cache=0', '/docs'],
    ['/docs/?cache=0', '/docs'],
    ['/api/v1/docs', '/api/v1/docs'],
    ['/api/v1/docs/openapi.json', '/api/v1/docs'],
  ])('deriva la ruta base de %s', (originalUrl, esperado) => {
    expect(resolveDocsBaseUrl(originalUrl)).toBe(esperado);
  });

  it('usa la ruta de respaldo en la raíz cuando la petición no contiene el segmento /docs', () => {
    expect(resolveDocsBaseUrl('/api/v1/health')).toBe('/docs');
    expect(resolveDocsBaseUrl('')).toBe('/docs');
    expect(resolveDocsBaseUrl('/otra/ruta')).toBe('/docs');
  });
});

describe('docs-url: rewriteRelativeAssetUrls', () => {
  it('reescribe las referencias relativas de los assets locales', () => {
    const html =
      '<link rel="stylesheet" href="./swagger-ui.css"><script src="./swagger-ui-bundle.js"></script>';

    expect(rewriteRelativeAssetUrls(html, '/docs')).toBe(
      '<link rel="stylesheet" href="/docs/swagger-ui.css"><script src="/docs/swagger-ui-bundle.js"></script>',
    );
  });

  it('reescribe también las referencias entre comillas simples', () => {
    expect(
      rewriteRelativeAssetUrls("<script src='./swagger-ui-init.js'></script>", '/docs'),
    ).toBe("<script src='/docs/swagger-ui-init.js'></script>");
  });

  it('deja intactas las referencias absolutas', () => {
    const html =
      '<script src="https://cdn.example.com/swagger.js"></script><link href="/docs/swagger-ui.css">';

    expect(rewriteRelativeAssetUrls(html, '/docs')).toBe(html);
  });

  it('no modifica un HTML sin referencias relativas', () => {
    const html = '<html><body>sin assets</body></html>';

    expect(rewriteRelativeAssetUrls(html, '/docs')).toBe(html);
  });
});

describe('DocsController (HTTP)', () => {
  let app: NestExpressApplication;
  let server: Server;
  let load: jest.Mock;

  beforeAll(async () => {
    load = jest.fn().mockResolvedValue(CONTRATO);

    const moduleRef = await Test.createTestingModule({
      controllers: [DocsController],
      providers: [{ provide: OpenApiSource, useValue: { load } }],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    // Igual que `main.ts`: la documentación se excluye del prefijo global y
    // vive en la raíz (`/docs`).
    app.setGlobalPrefix('api/v1', { exclude: ['docs', 'docs/openapi.json'] });
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    env.ENABLE_API_DOCS = true;
  });

  it('sirve la interfaz de Swagger en GET /docs', async () => {
    const response = await request(server).get('/docs');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/html; charset=utf-8');
    expect(response.text).toContain('<title>AgroConnect API — Documentación</title>');
  });

  it('aplica la CSP de la documentación sin upgrade-insecure-requests', async () => {
    const response = await request(server).get('/docs');

    expect(response.headers['content-security-policy']).toBe(CSP_ESPERADA);
    expect(response.headers['content-security-policy']).not.toContain('upgrade-insecure-requests');
  });

  it('marca la respuesta de la documentación como no cacheable', async () => {
    const response = await request(server).get('/docs');

    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('reescribe los assets de Swagger UI contra la ruta real de la API', async () => {
    const response = await request(server).get('/docs');

    expect(response.text).toContain('href="/docs/swagger-ui.css"');
    expect(response.text).toContain('src="/docs/swagger-ui-bundle.js"');
    expect(response.text).toContain('src="/docs/swagger-ui-init.js"');
    expect(response.text).not.toContain('"./swagger-ui.css"');
  });

  it('sirve el contrato OpenAPI 3.1 en GET /docs/openapi.json', async () => {
    const response = await request(server).get('/docs/openapi.json');

    const cuerpo = response.body as { openapi: string; paths: Record<string, unknown> };

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(cuerpo.openapi).toBe('3.1.0');
    expect(Object.keys(cuerpo.paths)).toHaveLength(1);
  });

  it('responde 404 cuando la documentación está deshabilitada', async () => {
    env.ENABLE_API_DOCS = false;

    const ui = await request(server).get('/docs');
    const contrato = await request(server).get('/docs/openapi.json');

    expect(ui.status).toBe(404);
    expect(contrato.status).toBe(404);
    expect(load).not.toHaveBeenCalled();
  });
});

describe('SwaggerAssetsMiddleware', () => {
  const load = jest.fn();
  const middleware = new SwaggerAssetsMiddleware({ load } as unknown as OpenApiSource);

  const peticion = (url: string, originalUrl: string): Request =>
    ({ url, originalUrl } as unknown as Request);

  beforeEach(() => {
    env.ENABLE_API_DOCS = true;
    load.mockReset();
    serveFilesMock.mockReset();
  });

  it('sirve los assets locales de Swagger UI', async () => {
    const initMiddleware = jest.fn((_req: Request, _res: Response, next: NextFunction) => next());
    const assetMiddleware = jest.fn();
    serveFilesMock.mockReturnValue([initMiddleware, assetMiddleware]);
    load.mockResolvedValue(CONTRATO);

    const next = jest.fn();
    await middleware.use(
      peticion('/swagger-ui.css', '/docs/swagger-ui.css'),
      {} as Response,
      next,
    );

    expect(serveFilesMock).toHaveBeenCalledWith(CONTRATO, {
      swaggerOptions: { url: '/docs/openapi.json' },
    });
    expect(initMiddleware).toHaveBeenCalled();
    expect(assetMiddleware).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('no intercepta la raíz de la documentación (la sirve el controller)', async () => {
    const next = jest.fn();

    await middleware.use(peticion('/', '/docs/'), {} as Response, next);

    expect(next).toHaveBeenCalledWith();
    expect(serveFilesMock).not.toHaveBeenCalled();
  });

  it('propaga el error cuando el contrato no se puede cargar', async () => {
    const error = new Error('contrato no disponible');
    load.mockRejectedValue(error);
    const next = jest.fn();

    await middleware.use(
      peticion('/swagger-ui.css', '/docs/swagger-ui.css'),
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith(error);
  });

  it('responde 404 cuando la documentación está deshabilitada', async () => {
    env.ENABLE_API_DOCS = false;
    const next = jest.fn();

    await middleware.use(
      peticion('/swagger-ui.css', '/docs/swagger-ui.css'),
      {} as Response,
      next,
    );

    expect(next).toHaveBeenCalledWith(expect.any(NotFoundException));
    expect(serveFilesMock).not.toHaveBeenCalled();
  });
});

describe('OpenApiSource', () => {
  let source: OpenApiSource;

  beforeEach(() => {
    source = new OpenApiSource();
    existsSyncMock.mockReset();
    readFileMock.mockReset();
  });

  it('resuelve y devuelve el contrato OpenAPI publicado por @agroconnect/contracts', async () => {
    existsSyncMock.mockReturnValue(true);
    readFileMock.mockResolvedValue(JSON.stringify(CONTRATO));

    const documento = await source.load();

    expect(documento).toEqual(CONTRATO);
    expect(existsSyncMock).toHaveBeenCalled();
    expect(readFileMock).toHaveBeenCalledWith(expect.any(String), 'utf8');
  });

  it('cachea la ruta resuelta del contrato entre llamadas', async () => {
    existsSyncMock.mockReturnValue(true);
    readFileMock.mockResolvedValue('{}');

    await source.load();
    const llamadasTrasPrimerLoad = existsSyncMock.mock.calls.length;
    await source.load();

    expect(existsSyncMock.mock.calls.length).toBe(llamadasTrasPrimerLoad);
  });

  it('falla con 500 cuando el contrato no existe en disco', async () => {
    existsSyncMock.mockReturnValue(false);

    await expect(source.load()).rejects.toThrow(/No se encontró el contrato OpenAPI/);
  });

  it('falla con 500 cuando el contrato no se puede leer', async () => {
    existsSyncMock.mockReturnValue(true);
    readFileMock.mockRejectedValue(new Error('EACCES'));

    await expect(source.load()).rejects.toThrow(/No fue posible leer el contrato OpenAPI/);
  });

  it('falla con 500 cuando el contrato no contiene JSON válido', async () => {
    existsSyncMock.mockReturnValue(true);
    readFileMock.mockResolvedValue('{ esto no es json');

    await expect(source.load()).rejects.toThrow(/no contiene JSON válido/);
  });

  it.each([
    ['un arreglo', '[]'],
    ['null', 'null'],
    ['una cadena', '"texto"'],
    ['un número', '42'],
  ])('rechaza %s porque no es un documento JSON de tipo objeto', async (_caso, contenido) => {
    existsSyncMock.mockReturnValue(true);
    readFileMock.mockResolvedValue(contenido);

    await expect(source.load()).rejects.toThrow(/no es un documento JSON de tipo objeto/);
  });
});
