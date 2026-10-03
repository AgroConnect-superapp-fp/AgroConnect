import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export function correlationId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header(CORRELATION_ID_HEADER);
  const id = incoming && incoming.length <= 128 ? incoming : randomUUID();

  req.correlationId = id;
  res.setHeader(CORRELATION_ID_HEADER, id);
  next();
}
