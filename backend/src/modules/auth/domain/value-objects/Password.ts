import { InvalidDataError } from '../errors/AuthErrors';

const MIN_LENGTH = 8;
const MAX_LENGTH = 72;
const HAS_LETTER = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/;
const HAS_NUMBER = /\d/;

export class Password {
  private constructor(readonly value: string) {}

  static create(raw: string): Password {
    if (raw.length < MIN_LENGTH) {
      throw new InvalidDataError(
        `La contraseña debe tener al menos ${MIN_LENGTH} caracteres`,
      );
    }

    if (raw.length > MAX_LENGTH) {
      throw new InvalidDataError(
        `La contraseña no puede superar los ${MAX_LENGTH} caracteres`,
      );
    }

    if (!HAS_LETTER.test(raw) || !HAS_NUMBER.test(raw)) {
      throw new InvalidDataError('La contraseña debe incluir letras y números');
    }

    return new Password(raw);
  }

  static get policyDescription(): string {
    return `Mínimo ${MIN_LENGTH} caracteres, con al menos una letra y un número`;
  }
}
