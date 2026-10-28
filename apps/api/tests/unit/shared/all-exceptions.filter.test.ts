import { HttpException, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { ZodError } from 'zod';
import { AllExceptionsFilter } from '../../../src/shared/errors/all-exceptions.filter';
import { DomainError, InfrastructureError } from '../../../src/shared/errors/errors';

interface CapturedResponse {
  statusCode: number;
  body: unknown;
}

/** Réplica encadenable de la respuesta de Express (`res.status(n).json(...)`). */
interface MockResponse {
  status(code: number): MockResponse;
  json(body: unknown): MockResponse;
}

function createHost(correlationId = 'corr-123'): {
  host: ArgumentsHost;
  captured: CapturedResponse;
} {
  const captured: CapturedResponse = { statusCode: 0, body: undefined };

  const response: MockResponse = {
    status(code: number): MockResponse {
      captured.statusCode = code;
      return response;
    },
    json(body: unknown): MockResponse {
      captured.body = body;
      return response;
    },
  };

  const request = { correlationId };

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, captured };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('traduce un DomainError a su status y su mensaje', () => {
    const { host, captured } = createHost();

    filter.catch(new DomainError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos', 401), host);

    expect(captured.statusCode).toBe(401);
    expect(captured.body).toEqual({
      success: false,
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Correo o contraseña incorrectos',
      },
      correlationId: 'corr-123',
    });
  });

  it('incluye los detalles de validación cuando existen', () => {
    const { host, captured } = createHost();

    filter.catch(new DomainError('VALIDATION_ERROR', 'Datos incompletos o inválidos', 422, ['correo: requerido']), host);

    expect(captured.statusCode).toBe(422);
    expect(captured.body).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        details: ['correo: requerido'],
      },
    });
  });

  it('NO expone el stack trace ni el mensaje interno de un error inesperado', () => {
    const { host, captured } = createHost();

    filter.catch(new Error('fallo interno con datos sensibles'), host);

    expect(captured.statusCode).toBe(500);
    expect(captured.body).toEqual({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error inesperado. Intente de nuevo más tarde.',
      },
      correlationId: 'corr-123',
    });
    expect(JSON.stringify(captured.body)).not.toContain('fallo interno');
    expect(JSON.stringify(captured.body)).not.toContain('stack');
  });

  it('oculta el mensaje interno de un InfrastructureError', () => {
    const { host, captured } = createHost();

    filter.catch(new InfrastructureError('fallo del pool de la base de datos'), host);

    expect(captured.statusCode).toBe(500);
    expect(captured.body).toMatchObject({
      error: { code: 'INTERNAL_ERROR' },
    });
    expect(JSON.stringify(captured.body)).not.toContain('pool');
  });

  it('traduce una HttpException de NestJS sin filtrar detalles internos', () => {
    const { host, captured } = createHost();

    filter.catch(new HttpException('Recurso no encontrado', HttpStatus.NOT_FOUND), host);

    expect(captured.statusCode).toBe(404);
    expect(captured.body).toMatchObject({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' },
    });
  });

  it('traduce un ZodError suelto a VALIDATION_ERROR 422 con detalles', () => {
    const { host, captured } = createHost();
    const zodError = new ZodError([
      { code: 'custom', path: ['correo'], message: 'Correo es obligatorio' },
    ]);

    filter.catch(zodError, host);

    expect(captured.statusCode).toBe(422);
    expect(captured.body).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Datos incompletos o inválidos',
        details: ['correo: Correo es obligatorio'],
      },
    });
  });

  it('omite la ruta cuando el issue de Zod no tiene path', () => {
    const { host, captured } = createHost();
    const zodError = new ZodError([{ code: 'custom', path: [], message: 'Error raíz' }]);

    filter.catch(zodError, host);

    expect(captured.body).toMatchObject({ error: { details: ['Error raíz'] } });
  });

  it('oculta el mensaje de una HttpException 500', () => {
    const { host, captured } = createHost();

    filter.catch(new HttpException('fallo interno del pool', HttpStatus.INTERNAL_SERVER_ERROR), host);

    expect(captured.statusCode).toBe(500);
    expect(captured.body).toMatchObject({
      error: { code: 'INTERNAL_ERROR', message: 'Error inesperado. Intente de nuevo más tarde.' },
    });
    expect(JSON.stringify(captured.body)).not.toContain('pool');
  });

  it('extrae el mensaje de una HttpException con payload objeto', () => {
    const { host, captured } = createHost();

    filter.catch(new HttpException({ message: 'Conflicto de correo' }, HttpStatus.CONFLICT), host);

    expect(captured.statusCode).toBe(409);
    expect(captured.body).toMatchObject({ error: { message: 'Conflicto de correo' } });
  });

  it('une en detalle los mensajes de una HttpException con array', () => {
    const { host, captured } = createHost();

    filter.catch(
      new HttpException({ message: ['correo inválido', 'contraseña corta'] }, HttpStatus.BAD_REQUEST),
      host,
    );

    expect(captured.body).toMatchObject({
      error: { message: 'correo inválido; contraseña corta' },
    });
  });

  it('usa un mensaje genérico cuando la HttpException no trae mensaje utilizable', () => {
    const { host, captured } = createHost();

    filter.catch(new HttpException({}, HttpStatus.BAD_REQUEST), host);

    expect(captured.body).toMatchObject({ error: { message: 'Solicitud rechazada.' } });
  });
});
