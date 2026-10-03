import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

export function createRateLimiter(options: { windowMs: number; max: number }) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Demasiados intentos. Intente de nuevo más tarde.',
        },
        correlationId: req.correlationId,
      });
    },
  });
}
