import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

/**
 * Documento OpenAPI 3.1 publicado por `@agroconnect/contracts` (ADR-015).
 */
export type OpenApiDocument = Record<string, unknown>;

const nodeRequire = createRequire(__filename);
const CONTRACTS_ENTRY = '@agroconnect/contracts/openapi.json';
const MAX_PARENT_DIRECTORIES = 8;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Lee el contrato OpenAPI desde disco en cada petición.
 *
 * El archivo se lee en runtime (no se incrusta en el bundle) para que el
 * contrato publicado por `@agroconnect/contracts` sea la única fuente de
 * verdad: si el JSON cambia, la documentación cambia en el siguiente arranque
 * sin recompilar la API.
 */
@Injectable()
export class OpenApiSource {
  private resolvedPath: string | undefined;

  async load(): Promise<OpenApiDocument> {
    const filePath = this.resolveFilePath();

    let raw: string;
    try {
      raw = await readFile(filePath, 'utf8');
    } catch {
      throw new InternalServerErrorException(
        `No fue posible leer el contrato OpenAPI en ${filePath}`,
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new InternalServerErrorException(
        `El contrato OpenAPI en ${filePath} no contiene JSON válido`,
      );
    }

    if (!isRecord(parsed)) {
      throw new InternalServerErrorException(
        `El contrato OpenAPI en ${filePath} no es un documento JSON de tipo objeto`,
      );
    }

    return parsed;
  }

  /**
   * Localiza el archivo del contrato. Primero usa la resolución de Node (el
   * paquete de contratos declara `"./openapi.json"` en su `exports`) y, si no
   * está disponible, busca la ruta del monorepo subiendo desde este archivo.
   */
  resolveFilePath(): string {
    if (this.resolvedPath) {
      return this.resolvedPath;
    }

    for (const candidate of this.candidates()) {
      if (existsSync(candidate)) {
        this.resolvedPath = candidate;
        return candidate;
      }
    }

    throw new InternalServerErrorException(
      `No se encontró el contrato OpenAPI (${CONTRACTS_ENTRY}). ` +
        'Ejecuta "npm run generate:openapi -w @agroconnect/contracts".',
    );
  }

  private candidates(): string[] {
    const candidates: string[] = [];

    try {
      candidates.push(nodeRequire.resolve(CONTRACTS_ENTRY));
    } catch {
      // Se continúa con la búsqueda por estructura del monorepo.
    }

    let current = __dirname;
    for (let depth = 0; depth <= MAX_PARENT_DIRECTORIES; depth += 1) {
      candidates.push(join(current, 'packages', 'contracts', 'openapi.json'));
      const parent = dirname(current);
      if (parent === current) {
        break;
      }
      current = parent;
    }

    return candidates;
  }
}
