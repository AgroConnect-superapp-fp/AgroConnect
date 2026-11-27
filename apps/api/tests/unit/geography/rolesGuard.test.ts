import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../../src/modules/identity/presentation/guards/roles.guard';

/**
 * Captura el error lanzado por una acción síncrona.
 *
 * Evita `expect.objectContaining(...)` dentro de `toThrow`: su tipo es `any` y
 * el linter rechaza el argumento inseguro.
 */
function captureError(action: () => unknown): unknown {
  try {
    action();
  } catch (error) {
    return error;
  }
  return undefined;
}

/**
 * Pruebas del guard de autorización por rol.
 *
 * Vive en `tests/unit/geography/` porque es el guard que protege el módulo de
 * parcelas; el guard es reutilizable por cualquier otro módulo.
 */
const handler = () => undefined;
const controllerClass = class {};

const buildContext = (role?: string): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => (role ? { user: { id: 'user-1', role } } : {}),
    }),
    getHandler: () => handler,
    getClass: () => controllerClass,
  }) as unknown as ExecutionContext;

const buildGuard = (required?: readonly string[]) => {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(required),
  } as unknown as Reflector;

  return new RolesGuard(reflector);
};

describe('RolesGuard', () => {
  it('deja pasar cuando el endpoint no declara roles', () => {
    const guard = buildGuard(undefined);

    expect(guard.canActivate(buildContext('comprador_b2b'))).toBe(true);
  });

  it('deja pasar a un actor con un rol autorizado', () => {
    const guard = buildGuard(['productor', 'administrador']);

    expect(guard.canActivate(buildContext('productor'))).toBe(true);
    expect(guard.canActivate(buildContext('administrador'))).toBe(true);
  });

  it('rechaza con 403 a un actor con un rol no autorizado', () => {
    const guard = buildGuard(['productor', 'administrador']);

    const error = captureError(() => guard.canActivate(buildContext('comprador_b2b')));
    expect(error).toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });

  it('rechaza con 401 cuando no hay sesión', () => {
    const guard = buildGuard(['productor', 'administrador']);

    const error = captureError(() => guard.canActivate(buildContext()));
    expect(error).toMatchObject({ code: 'UNAUTHORIZED', statusCode: 401 });
  });
});
