import {
  ApplicationError,
  DomainError,
  InfrastructureError,
} from '../../../src/shared/errors/errors';

describe('errores de la aplicación', () => {
  it('DomainError expone código, status y mensaje', () => {
    const error = new DomainError('INVALID_CREDENTIALS', 'Credenciales incorrectas', 401);

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('INVALID_CREDENTIALS');
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Credenciales incorrectas');
    expect(error.name).toBe('DomainError');
    expect(error.details).toBeUndefined();
  });

  it('DomainError acepta detalles de validación', () => {
    const error = new DomainError('VALIDATION_ERROR', 'Datos inválidos', 422, ['correo: requerido']);

    expect(error.details).toEqual(['correo: requerido']);
  });

  it('DomainError usa 400 por defecto', () => {
    expect(new DomainError('BAD_REQUEST', 'Solicitud inválida').statusCode).toBe(400);
  });

  it('ApplicationError expone código, status y mensaje', () => {
    const error = new ApplicationError('CONFLICT', 'Conflicto de estado', 409, ['duplicado']);

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('CONFLICT');
    expect(error.statusCode).toBe(409);
    expect(error.details).toEqual(['duplicado']);
    expect(error.name).toBe('ApplicationError');
  });

  it('ApplicationError usa 400 por defecto', () => {
    expect(new ApplicationError('BAD_REQUEST', 'Solicitud inválida').statusCode).toBe(400);
  });

  it('InfrastructureError se traduce a INTERNAL_ERROR 500', () => {
    const error = new InfrastructureError('fallo del pool de la base de datos');

    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('InfrastructureError');
  });

  it('InfrastructureError encadena la causa cuando es un Error', () => {
    const causa = new Error('conexión rechazada');
    const error = new InfrastructureError('fallo de infraestructura', causa);

    expect(error.cause).toBe(causa);
  });

  it('InfrastructureError ignora una causa que no es Error', () => {
    const error = new InfrastructureError('fallo de infraestructura', 'texto plano');

    expect(error.cause).toBeUndefined();
  });
});
