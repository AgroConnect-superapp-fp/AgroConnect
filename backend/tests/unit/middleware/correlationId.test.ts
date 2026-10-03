import type { NextFunction, Request, Response } from 'express';
import {
  CORRELATION_ID_HEADER,
  correlationId,
} from '../../../src/shared/presentation/middleware/correlationId';

function mockRequest(header?: string): Request {
  return { header: jest.fn().mockReturnValue(header) } as unknown as Request;
}

function mockResponse(): Response {
  return { setHeader: jest.fn() } as unknown as Response;
}

describe('correlationId', () => {
  it('reutiliza el id entrante cuando es válido', () => {
    const req = mockRequest('corr-123');
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    correlationId(req, res, next);

    expect(req.correlationId).toBe('corr-123');
    expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, 'corr-123');
    expect(next).toHaveBeenCalledWith();
  });

  it('genera un id nuevo cuando no viene el header', () => {
    const req = mockRequest(undefined);
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    correlationId(req, res, next);

    expect(req.correlationId).toEqual(expect.any(String));
    expect(req.correlationId).not.toHaveLength(0);
    expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, req.correlationId);
  });

  it('descarta un header demasiado largo (más de 128 caracteres) y genera uno nuevo', () => {
    const tooLong = 'x'.repeat(129);
    const req = mockRequest(tooLong);
    const res = mockResponse();
    const next = jest.fn() as NextFunction;

    correlationId(req, res, next);

    expect(req.correlationId).not.toBe(tooLong);
    expect(req.correlationId?.length).toBeLessThanOrEqual(128);
    expect(res.setHeader).toHaveBeenCalledWith(CORRELATION_ID_HEADER, req.correlationId);
  });
});
