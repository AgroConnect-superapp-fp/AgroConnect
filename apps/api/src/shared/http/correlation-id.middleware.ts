import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/**
 * Correlation ID por petición (SPEC §8).
 * Mismo header que el backend legacy: `x-correlation-id`.
 */
export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Formato admitido para un correlation ID entrante.
 *
 * El header lo envía el cliente, así que no puede ser una cadena arbitraria:
 * se acepta solo un identificador corto y seguro (letras, dígitos, punto,
 * guion y guion bajo). Cualquier otra cosa se descarta y se genera un UUID,
 * para que un valor malicioso no acabe en los logs ni en la cabecera de
 * respuesta.
 */
export const CORRELATION_ID_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

export function correlationId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(CORRELATION_ID_HEADER);
  const id = incoming && CORRELATION_ID_PATTERN.test(incoming) ? incoming : randomUUID();

  req.correlationId = id;
  res.setHeader(CORRELATION_ID_HEADER, id);
  next();
}
