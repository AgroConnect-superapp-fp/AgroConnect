import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';

export function createRateLimiter(options: { windowMs: number; limit: number }) {
  return rateLimit({
    windowMs: options.windowMs,
    // express-rate-limit v8 renombró `max` a `limit`. La v8 además aplica por
    // defecto la máscara de subred IPv6 (/56) en el key generator: sin ella un
    // cliente IPv6 podría rotar direcciones y evadir el límite.
    limit: options.limit,
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
