import type { NextFunction, Request, Response } from 'express';
import {
  CORRELATION_ID_HEADER,
  correlationId,
} from '../../../src/shared/http/correlation-id.middleware';

function createRequest(headers: Record<string, string>): Request {
  return {
    header: (name: string) => headers[name],
  } as unknown as Request;
}

function createResponse(): { res: Response; setHeader: jest.Mock } {
  const setHeader = jest.fn();
  const res = { setHeader } as unknown as Response;
  return { res, setHeader };
}

describe('correlationId', () => {
  it('reutiliza el correlation ID entrante si no es excesivo', () => {
    const req = createRequest({ [CORRELATION_ID_HEADER]: 'abc-123' });
    const { res, setHeader } = createResponse();
    const next = jest.fn() as NextFunction;

    correlationId(req, res, next);

    expect(req.correlationId).toBe('abc-123');
    expect(setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, 'abc-123');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('genera un UUID cuando no hay correlation ID entrante', () => {
    const req = createRequest({});
    const { res } = createResponse();

    correlationId(req, res, jest.fn() as NextFunction);

    expect(req.correlationId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('ignora un correlation ID entrante demasiado largo', () => {
    const req = createRequest({ [CORRELATION_ID_HEADER]: 'x'.repeat(129) });
    const { res } = createResponse();

    correlationId(req, res, jest.fn() as NextFunction);

    expect(req.correlationId).not.toBe('x'.repeat(129));
    expect(req.correlationId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('acepta un correlation ID con el formato admitido', () => {
    const req = createRequest({ [CORRELATION_ID_HEADER]: 'traza.2026-11-16_01' });
    const { res, setHeader } = createResponse();

    correlationId(req, res, jest.fn() as NextFunction);

    expect(req.correlationId).toBe('traza.2026-11-16_01');
    expect(setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, 'traza.2026-11-16_01');
  });

  it.each([
    ['con espacios', 'traza con espacios'],
    ['con salto de línea', 'traza\ninyectada'],
    ['con caracteres de control', 'traza\u0000'],
    ['con angle brackets', '<script>alert(1)</script>'],
    ['con coma y espacio', 'traza, otra'],
  ])('descarta un correlation ID entrante %s', (_caso, valor) => {
    const req = createRequest({ [CORRELATION_ID_HEADER]: valor });
    const { res } = createResponse();

    correlationId(req, res, jest.fn() as NextFunction);

    expect(req.correlationId).not.toBe(valor);
    expect(req.correlationId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('descarta un correlation ID entrante de más de 64 caracteres', () => {
    const valor = 'a'.repeat(65);
    const req = createRequest({ [CORRELATION_ID_HEADER]: valor });
    const { res } = createResponse();

    correlationId(req, res, jest.fn() as NextFunction);

    expect(req.correlationId).not.toBe(valor);
    expect(req.correlationId).toMatch(/^[0-9a-f-]{36}$/);
  });
});
