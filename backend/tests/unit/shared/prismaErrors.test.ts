import { uniqueViolationTarget } from '@/shared/infrastructure/prismaErrors';

describe('uniqueViolationTarget', () => {
  it('devuelve null cuando el error no es un objeto con code string', () => {
    expect(uniqueViolationTarget(null)).toBeNull();
    expect(uniqueViolationTarget(undefined)).toBeNull();
    expect(uniqueViolationTarget('P2002')).toBeNull();
    expect(uniqueViolationTarget(42)).toBeNull();
    expect(uniqueViolationTarget({})).toBeNull();
    expect(uniqueViolationTarget({ code: 2002 })).toBeNull();
  });

  it('devuelve null cuando el código de Prisma no es P2002', () => {
    expect(
      uniqueViolationTarget({ code: 'P2025', message: 'Registro no encontrado' }),
    ).toBeNull();
  });

  it('extrae el target de la restricción violada en minúsculas', () => {
    const error = {
      code: 'P2002',
      meta: { target: 'usuarios_correo_key' },
      message: 'Unique constraint failed on the constraint',
    };

    expect(uniqueViolationTarget(error)).toBe(
      '{"target":"usuarios_correo_key"} unique constraint failed on the constraint',
    );
  });

  it('incluye el detalle del driver adapter cuando no hay target', () => {
    const error = {
      code: 'P2002',
      meta: { driverAdapterError: { detail: 'correo duplicado' } },
      message: 'duplicated key value',
    };

    expect(uniqueViolationTarget(error)).toContain('correo duplicado');
  });

  it('usa un objeto vacío cuando el error P2002 no trae meta', () => {
    expect(uniqueViolationTarget({ code: 'P2002', message: 'dup' })).toBe('{} dup');
  });
});
