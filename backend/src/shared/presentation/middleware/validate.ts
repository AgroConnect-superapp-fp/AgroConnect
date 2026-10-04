import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodSchema } from 'zod';
import { DomainError } from '../../domain/errors';

export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
      });

      next(new DomainError('VALIDATION_ERROR', 'Datos incompletos o inválidos', 422, details));
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const details = result.error.issues.map((issue) => {
        const path = issue.path.join('.');
        return path ? `${path}: ${issue.message}` : issue.message;
      });

      next(new DomainError('VALIDATION_ERROR', 'Parámetros de consulta inválidos', 422, details));
      return;
    }

    next();
  };
}
