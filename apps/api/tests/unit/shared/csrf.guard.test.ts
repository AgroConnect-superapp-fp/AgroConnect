import type { ExecutionContext } from '@nestjs/common';
import { CsrfGuard } from '../../../src/shared/http/csrf.guard';
import { DomainError } from '../../../src/shared/errors/errors';

const ALLOWED_ORIGIN = 'http://localhost:5173';

function context(method: string, headers: Record<string, string | undefined>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method, headers }),
    }),
  } as unknown as ExecutionContext;
}

describe('CsrfGuard', () => {
  const guard = new CsrfGuard();

  it('permite métodos seguros sin comprobar origen', () => {
    expect(guard.canActivate(context('GET', {}))).toBe(true);
    expect(guard.canActivate(context('HEAD', { origin: 'https://evil.test' }))).toBe(true);
    expect(guard.canActivate(context('OPTIONS', {}))).toBe(true);
  });

  it('rechaza un origen que no está en CORS_ORIGIN', () => {
    expect(() =>
      guard.canActivate(
        context('POST', {
          origin: 'https://evil.test',
          'x-requested-with': 'XMLHttpRequest',
        })
      )
    ).toThrow(DomainError);
  });

  it('acepta el origen permitido con el header CSRF', () => {
    expect(
      guard.canActivate(
        context('POST', {
          origin: ALLOWED_ORIGIN,
          'x-requested-with': 'XMLHttpRequest',
        })
      )
    ).toBe(true);
  });

  it('acepta Referer permitido como respaldo de Origin', () => {
    expect(
      guard.canActivate(
        context('POST', {
          referer: `${ALLOWED_ORIGIN}/registro`,
          'x-requested-with': 'XMLHttpRequest',
        })
      )
    ).toBe(true);
  });

  it('en pruebas permite clientes sin Origin (las suites de integración no lo envían)', () => {
    expect(guard.canActivate(context('POST', {}))).toBe(true);
  });
});
