import { loginSchema, registerSchema } from '@agroconnect/contracts';
import { z } from 'zod';
import { DomainError } from '../../../src/shared/errors/errors';
import { ZodValidationPipe, formatZodIssues } from '../../../src/shared/http/zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(loginSchema);

  it('devuelve el dato parseado cuando el cuerpo es válido', () => {
    const result = pipe.transform({ correo: 'PRODUCTOR@AGROCONNECT.CO', password: 'secreto123' });

    expect(result).toEqual({ correo: 'productor@agroconnect.co', password: 'secreto123' });
  });

  it('lanza DomainError 422 VALIDATION_ERROR cuando el cuerpo es inválido', () => {
    expect.assertions(3);

    try {
      pipe.transform({ correo: 'no-es-un-correo', password: '' });
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(DomainError);
      const domainError = error as DomainError;
      expect(domainError.statusCode).toBe(422);
      expect(domainError.code).toBe('VALIDATION_ERROR');
    }
  });

  it('lanza DomainError cuando el tipo del campo es incorrecto', () => {
    expect.assertions(2);

    try {
      pipe.transform({ correo: 42, password: 'secreto123' });
    } catch (error: unknown) {
      const domainError = error as DomainError;
      expect(domainError.statusCode).toBe(422);
      expect(domainError.details?.join(' ')).toContain('correo');
    }
  });

  it('formatea los issues como `ruta: mensaje` (formato que consume el frontend)', () => {
    const parsed = loginSchema.safeParse({ correo: 'no-es-un-correo', password: '' });
    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      const details = formatZodIssues(parsed.error);
      expect(details.length).toBeGreaterThan(0);
      expect(details.every((detail) => detail.includes(': '))).toBe(true);
      expect(details[0]).toContain('correo');
    }
  });

  it('usa el mensaje configurado en el pipe', () => {
    // `z.object({})` descarta las claves desconocidas en Zod 4, así que se usa
    // un esquema con una clave requerida para provocar el rechazo de verdad.
    const customPipe = new ZodValidationPipe(z.object({ hola: z.string() }), 'Parámetros inválidos');

    expect(() => customPipe.transform({})).toThrow('Parámetros inválidos');
  });

  it('valida contra un esquema del paquete de contratos compartidos', () => {
    const registerPipe = new ZodValidationPipe(registerSchema);
    const validRegister = {
      nombre: 'Ana Rodríguez',
      documento: '1098765434',
      correo: 'ana@agroconnect.co',
      celular: '3101234567',
      password: 'secreto123',
      rol: 'productor',
      aceptaTratamientoDatos: true,
    };

    expect(registerPipe.transform(validRegister)).toMatchObject({ correo: 'ana@agroconnect.co' });
  });
});
