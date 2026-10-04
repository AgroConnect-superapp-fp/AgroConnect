import type { NextFunction, Request, Response } from 'express';
import express from 'express';
import request from 'supertest';
import { ZodError } from 'zod';
import { z } from 'zod';
import { validateBody, validateQuery } from '../../../src/shared/presentation/middleware/validate';
import { errorHandler } from '../../../src/shared/presentation/middleware/errorHandler';
import { createRateLimiter } from '../../../src/modules/auth/presentation/middleware/rateLimiters';
import {
  ApplicationError,
  DomainError,
  InfrastructureError,
} from '../../../src/shared/domain/errors';

function mockResponse(): Response {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn(),
  };
  return res as unknown as Response;
}

describe('validateBody', () => {
  const schema = z.object({ nombre: z.string().min(3) });

  it('deja pasar un cuerpo válido y lo normaliza', () => {
    const middleware = validateBody(schema);
    const req = { body: { nombre: 'Ana' } } as Request;
    const next = jest.fn() as NextFunction;

    middleware(req, mockResponse(), next);

    expect(next).toHaveBeenCalledWith();
    expect(req.body).toEqual({ nombre: 'Ana' });
  });

  it('rechaza un cuerpo inválido con VALIDATION_ERROR 422', () => {
    const middleware = validateBody(schema);
    const next = jest.fn() as NextFunction;

    middleware({ body: { nombre: 'Al' } } as Request, mockResponse(), next);

    const error = (next as jest.Mock).mock.calls[0]?.[0] as DomainError;
    expect(error).toBeInstanceOf(DomainError);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(422);
    expect(error.details?.[0]).toContain('nombre');
  });

  it('reporta el mensaje sin prefijo cuando el problema no tiene ruta', () => {
    const middleware = validateBody(z.string().min(3, 'Demasiado corto'));
    const next = jest.fn() as NextFunction;

    middleware({ body: 'Al' } as Request, mockResponse(), next);

    const error = (next as jest.Mock).mock.calls[0]?.[0] as DomainError;
    expect(error.details).toEqual(['Demasiado corto']);
  });
});

describe('validateQuery', () => {
  const schema = z.object({ page: z.coerce.number().int().positive() });

  it('deja pasar una consulta válida', () => {
    const middleware = validateQuery(schema);
    const next = jest.fn() as NextFunction;

    middleware({ query: { page: '2' } } as unknown as Request, mockResponse(), next);

    expect(next).toHaveBeenCalledWith();
  });

  it('rechaza una consulta inválida con 422', () => {
    const middleware = validateQuery(schema);
    const next = jest.fn() as NextFunction;

    middleware({ query: { page: '-1' } } as unknown as Request, mockResponse(), next);

    const error = (next as jest.Mock).mock.calls[0]?.[0] as DomainError;
    expect(error.statusCode).toBe(422);
    expect(error.details?.[0]).toContain('page');
  });

  it('reporta el mensaje sin prefijo cuando el problema no tiene ruta', () => {
    const middleware = validateQuery(z.string().min(3, 'Demasiado corto'));
    const next = jest.fn() as NextFunction;

    middleware({ query: 'ab' } as unknown as Request, mockResponse(), next);

    const error = (next as jest.Mock).mock.calls[0]?.[0] as DomainError;
    expect(error.details).toEqual(['Demasiado corto']);
  });
});

describe('errorHandler', () => {
  it('responde con el código y estado de un DomainError', () => {
    const res = mockResponse();
    const error = new DomainError(
      'EMAIL_ALREADY_EXISTS',
      'El correo ya se encuentra registrado',
      409,
    );

    errorHandler(error, { correlationId: 'corr-1' } as Request, res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'EMAIL_ALREADY_EXISTS' }),
        correlationId: 'corr-1',
      }),
    );
  });

  it('registra y responde un ApplicationError de servidor', () => {
    const res = mockResponse();
    const error = new ApplicationError('INTERNAL_ERROR', 'Fallo interno', 500);

    errorHandler(error, {} as Request, res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('convierte un ZodError en 422 con detalles', () => {
    const res = mockResponse();
    const zodError = new ZodError([
      { code: 'custom', path: ['correo'], message: 'Correo inválido' },
    ]);

    errorHandler(zodError, {} as Request, res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'VALIDATION_ERROR',
          details: ['correo: Correo inválido'],
        }),
      }),
    );
  });

  it('convierte un ZodError sin ruta en un detalle simple', () => {
    const res = mockResponse();
    const zodError = new ZodError([{ code: 'custom', path: [], message: 'Valor inválido' }]);

    errorHandler(zodError, {} as Request, res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ details: ['Valor inválido'] }),
      }),
    );
  });

  it('omite los detalles cuando el arreglo viene vacío', () => {
    const res = mockResponse();
    const error = new DomainError('VALIDATION_ERROR', 'Inválido', 422, []);

    errorHandler(error, {} as Request, res, jest.fn() as NextFunction);

    const body = (res.json as jest.Mock).mock.calls[0]?.[0] as { error: { details?: unknown } };
    expect(body.error.details).toBeUndefined();
  });

  it('responde 500 sin detalles internos para errores desconocidos', () => {
    const res = mockResponse();

    errorHandler(new Error('boom interno'), {} as Request, res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ code: 'INTERNAL_ERROR' }),
      }),
    );
    const body = (res.json as jest.Mock).mock.calls[0]?.[0] as { error: { message: string } };
    expect(body.error.message).not.toContain('boom interno');
  });
});

describe('Errores compartidos', () => {
  it('InfrastructureError encapsula la causa y usa 500', () => {
    const cause = new Error('conexión rechazada');
    const error = new InfrastructureError('No fue posible guardar', cause);

    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.cause).toBe(cause);
  });

  it('los detalles viajan solo cuando existen', () => {
    const withDetails = new DomainError('VALIDATION_ERROR', 'Inválido', 422, ['campo']);
    const withoutDetails = new DomainError('VALIDATION_ERROR', 'Inválido', 422);

    expect(withDetails.details).toEqual(['campo']);
    expect(withoutDetails.details).toBeUndefined();
  });

  it('usa los valores por defecto de DomainError y ApplicationError', () => {
    const domain = new DomainError('NOT_FOUND', 'No encontrado');
    expect(domain.statusCode).toBe(400);
    expect(domain.details).toBeUndefined();

    const application = new ApplicationError('INTERNAL_ERROR', 'Fallo');
    expect(application.statusCode).toBe(400);
    expect(application.details).toBeUndefined();
  });

  it('InfrastructureError sin causa no asigna cause', () => {
    const error = new InfrastructureError('Fallo sin causa');

    expect(error.cause).toBeUndefined();
  });
});

describe('createRateLimiter', () => {
  it('bloquea con 429 y código RATE_LIMITED al superar el máximo', async () => {
    const app = express();
    app.use(express.json());
    app.post('/limitado', createRateLimiter({ windowMs: 60_000, max: 1 }), (_req, res) => {
      res.status(200).json({ ok: true });
    });

    const first = await request(app).post('/limitado').send({});
    const second = await request(app).post('/limitado').send({});

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(second.body).toMatchObject({
      success: false,
      error: { code: 'RATE_LIMITED' },
    });
  });
});
