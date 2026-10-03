import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../domain/errors';
import { logger } from '../../infrastructure/logger';

interface ErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
  correlationId?: string;
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const correlationId = req.correlationId;

  if (error instanceof AppError) {
    const body: ErrorBody = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && error.details.length > 0 ? { details: error.details } : {}),
      },
      correlationId,
    };

    if (error.statusCode >= 500) {
      logger.error({ err: error, correlationId }, 'Error de aplicación');
    } else {
      logger.warn(
        { code: error.code, statusCode: error.statusCode, correlationId },
        'Solicitud rechazada',
      );
    }

    res.status(error.statusCode).json(body);
    return;
  }

  if (error instanceof ZodError) {
    const details = error.issues.map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    });

    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos incompletos o inválidos',
        details,
      },
      correlationId,
    } satisfies ErrorBody);
    return;
  }

  logger.error({ err: error, correlationId }, 'Error no controlado');

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error inesperado. Intente de nuevo más tarde.',
    },
    correlationId,
  } satisfies ErrorBody);
}
