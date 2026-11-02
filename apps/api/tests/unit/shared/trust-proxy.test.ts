import type { NestExpressApplication } from '@nestjs/platform-express';
import { configureApp } from '../../../src/app.setup';
import { env } from '../../../src/shared/config/env';

/**
 * El rate limiting detrás del proxy de Render depende de que Express confíe en
 * el primer salto (`TRUST_PROXY=1`). Sin esto, `req.ip` es la IP del balanceador
 * y todos los clientes comparten un único bucket.
 */
describe('configureApp — trust proxy', () => {
  function createApp(): NestExpressApplication {
    return {
      set: jest.fn(),
      use: jest.fn(),
      enableCors: jest.fn(),
    } as unknown as NestExpressApplication;
  }

  it('aplica TRUST_PROXY al framework', () => {
    const app = createApp();
    const previous = env.TRUST_PROXY;

    env.TRUST_PROXY = 1;
    try {
      configureApp(app);
      expect(app.set).toHaveBeenCalledWith('trust proxy', 1);
    } finally {
      env.TRUST_PROXY = previous;
    }
  });

  it('mantiene 0 cuando no hay proxy delante', () => {
    const app = createApp();
    const previous = env.TRUST_PROXY;

    env.TRUST_PROXY = 0;
    try {
      configureApp(app);
      expect(app.set).toHaveBeenCalledWith('trust proxy', 0);
    } finally {
      env.TRUST_PROXY = previous;
    }
  });
});
