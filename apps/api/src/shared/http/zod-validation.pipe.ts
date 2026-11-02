import { Injectable, type PipeTransform } from '@nestjs/common';
import { type ZodType, z } from 'zod';
import { DomainError } from '../errors/errors';

/**
 * Convierte los issues de Zod al formato `ruta: mensaje` que ya consume el
 * frontend (`frontend/src/auth/schemas/authSchemas.ts` → `serverDetailsToFields`).
 */
export function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });
}

/**
 * Pipe de validación con Zod (ADR-015: contract-first).
 *
 * El proyecto es contract-first con Zod: NO se usa class-validator. El esquema
 * se toma de `@agroconnect/contracts` (o de un esquema local equivalente) y el
 * pipe devuelve el dato ya parseado y coerceado por Zod.
 *
 * Los errores se lanzan como `DomainError` con código `VALIDATION_ERROR` y
 * status 422 — el mismo contrato que el backend legacy.
 */
@Injectable()
export class ZodValidationPipe<S extends ZodType> implements PipeTransform<unknown, z.infer<S>> {
  constructor(
    private readonly schema: S,
    private readonly message: string = 'Datos incompletos o inválidos',
  ) {}

  transform(value: unknown): z.infer<S> {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new DomainError('VALIDATION_ERROR', this.message, 422, formatZodIssues(result.error));
    }

    return result.data;
  }
}
