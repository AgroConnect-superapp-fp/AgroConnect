import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError, type ErrorCode } from './errors';
import { logger } from '../logger/logger';

/**
 * Cuerpo de error: EXACTAMENTE el mismo formato que produce el backend legacy
 * (`backend/src/shared/presentation/middleware/errorHandler.ts`), para que el
 * frontend no cambie durante la migración progresiva.
 */
export interface ErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
  correlationId?: string;
}

const STATUS_TO_CODE: Readonly<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
  [HttpStatus.TOO_MANY_REQUESTS]: 'RATE_LIMITED',
};

/**
 * Filtro global de excepciones.
 *
 * Traduce los errores de dominio (`DomainError`, `ApplicationError`,
 * `InfrastructureError`), los errores HTTP de NestJS y los `ZodError` sueltos a
 * una respuesta JSON consistente. NUNCA se expone el stack trace al cliente
 * (SPEC §9): los errores inesperados devuelven un mensaje genérico y sólo se
 * registran en el log del servidor.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const correlationId = request.correlationId;

    if (exception instanceof AppError) {
      this.handleAppError(exception, response, correlationId);
      return;
    }

    if (exception instanceof ZodError) {
      response.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Datos incompletos o inválidos',
          details: exception.issues.map((issue) => {
            const path = issue.path.join('.');
            return path ? `${path}: ${issue.message}` : issue.message;
          }),
        },
        correlationId,
      } satisfies ErrorBody);
      return;
    }

    if (exception instanceof HttpException) {
      this.handleHttpException(exception, response, correlationId);
      return;
    }

    logger.error({ err: exception, correlationId }, 'Error no controlado');

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error inesperado. Intente de nuevo más tarde.',
      },
      correlationId,
    } satisfies ErrorBody);
  }

  private handleAppError(
    error: AppError,
    response: Response,
    correlationId: string | undefined,
  ): void {
    if (error.statusCode >= 500) {
      logger.error({ err: error, correlationId }, 'Error de aplicación');
    } else {
      logger.warn(
        { code: error.code, statusCode: error.statusCode, correlationId },
        'Solicitud rechazada',
      );
    }

    // SPEC §9: el cliente nunca recibe stack traces ni mensajes internos.
    // En errores 5xx el mensaje real puede filtrar detalles de infraestructura
    // (pool de conexiones, SQL, rutas), así que se sustituye por uno genérico.
    const isServerError = error.statusCode >= 500;

    response.status(error.statusCode).json({
      success: false,
      error: {
        code: isServerError ? 'INTERNAL_ERROR' : error.code,
        message: isServerError ? 'Error inesperado. Intente de nuevo más tarde.' : error.message,
        ...(!isServerError && error.details && error.details.length > 0
          ? { details: error.details }
          : {}),
      },
      correlationId,
    } satisfies ErrorBody);
  }

  private handleHttpException(
    error: HttpException,
    response: Response,
    correlationId: string | undefined,
  ): void {
    const status = error.getStatus();
    const payload = error.getResponse();
    const message = this.extractMessage(payload, status);

    if (status >= 500) {
      logger.error({ err: error, correlationId }, 'Error de aplicación');
    } else {
      logger.warn({ statusCode: status, correlationId }, 'Solicitud rechazada');
    }

    response.status(status).json({
      success: false,
      error: {
        code: STATUS_TO_CODE[status] ?? 'INTERNAL_ERROR',
        message,
      },
      correlationId,
    } satisfies ErrorBody);
  }

  /** Extrae el mensaje de una HttpException sin filtrar detalles internos. */
  private extractMessage(payload: string | object, status: number): string {
    if (typeof payload === 'string') {
      return status >= 500 ? 'Error inesperado. Intente de nuevo más tarde.' : payload;
    }

    const raw = (payload as { message?: unknown }).message;

    if (typeof raw === 'string' && raw.length > 0) {
      return status >= 500 ? 'Error inesperado. Intente de nuevo más tarde.' : raw;
    }

    if (Array.isArray(raw)) {
      const details = raw.filter((item): item is string => typeof item === 'string');
      if (details.length > 0) {
        return details.join('; ');
      }
    }

    return status >= 500 ? 'Error inesperado. Intente de nuevo más tarde.' : 'Solicitud rechazada.';
  }
}
