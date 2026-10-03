import { Email } from '../../../src/modules/auth/domain/value-objects/Email';
import { Password } from '../../../src/modules/auth/domain/value-objects/Password';
import { Documento } from '../../../src/modules/auth/domain/value-objects/Documento';
import { Celular } from '../../../src/modules/auth/domain/value-objects/Celular';
import { DomainError } from '../../../src/shared/domain/errors';

describe('Email', () => {
  it('normaliza a minúsculas y recorta espacios', () => {
    const email = Email.create('  Maria.Lopez@Example.COM ');
    expect(email.value).toBe('maria.lopez@example.com');
  });

  it('rechaza correos sin formato válido', () => {
    expect(() => Email.create('correo-invalido')).toThrow(DomainError);
    expect(() => Email.create('sin@dominio')).toThrow(DomainError);
    expect(() => Email.create('')).toThrow(DomainError);
  });

  it('rechaza correos que superan los 254 caracteres', () => {
    const largo = `${'a'.repeat(250)}@b.com`;
    expect(() => Email.create(largo)).toThrow('254');
  });

  it('compara dos correos equivalentes', () => {
    const a = Email.create('a@b.com');
    const b = Email.create('A@B.COM');
    expect(a.equals(b)).toBe(true);
  });
});

describe('Password', () => {
  it('acepta contraseñas con longitud y composición válidas', () => {
    expect(Password.create('Agro2026*').value).toBe('Agro2026*');
    expect(Password.create('ClaveSegura123').value).toBe('ClaveSegura123');
  });

  it('rechaza contraseñas de menos de 8 caracteres', () => {
    expect(() => Password.create('Corta1')).toThrow('al menos 8 caracteres');
  });

  it('rechaza contraseñas sin letras o sin números', () => {
    expect(() => Password.create('12345678')).toThrow('letras y números');
    expect(() => Password.create('abcdefgh')).toThrow('letras y números');
  });

  it('rechaza contraseñas mayores a 72 caracteres', () => {
    expect(() => Password.create(`A1${'x'.repeat(71)}`)).toThrow('72 caracteres');
  });

  it('expone la política de la contraseña', () => {
    expect(Password.policyDescription).toContain('8 caracteres');
  });
});

describe('Documento', () => {
  it('acepta documentos de solo dígitos entre 6 y 12 caracteres', () => {
    expect(Documento.create('1098765432').value).toBe('1098765432');
    expect(Documento.create('123456').value).toBe('123456');
  });

  it('rechaza documentos con letras o símbolos', () => {
    expect(() => Documento.create('10987A5432')).toThrow('solo dígitos');
    expect(() => Documento.create('10-987')).toThrow(DomainError);
  });

  it('rechaza documentos fuera del rango de longitud', () => {
    expect(() => Documento.create('12345')).toThrow('entre 6 y 12');
    expect(() => Documento.create('1234567890123')).toThrow('entre 6 y 12');
  });
});

describe('Celular', () => {
  it('acepta celulares colombianos de 10 dígitos que inician en 3', () => {
    expect(Celular.create('3105557788').value).toBe('3105557788');
    expect(Celular.create('300 123 4567').value).toBe('3001234567');
  });

  it('rechaza celulares con formato inválido', () => {
    expect(() => Celular.create('2105557788')).toThrow(DomainError);
    expect(() => Celular.create('310555778')).toThrow(DomainError);
    expect(() => Celular.create('31055577889')).toThrow(DomainError);
  });
});
