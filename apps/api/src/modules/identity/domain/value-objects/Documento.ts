import { InvalidDataError } from '../errors/AuthErrors';

const DIGITS_ONLY = /^\d+$/;
const MIN_LENGTH = 6;
const MAX_LENGTH = 12;

export class Documento {
  private constructor(readonly value: string) {}

  static create(raw: string): Documento {
    const value = raw.trim();

    if (!DIGITS_ONLY.test(value)) {
      throw new InvalidDataError('El documento debe contener solo dígitos');
    }

    if (value.length < MIN_LENGTH || value.length > MAX_LENGTH) {
      throw new InvalidDataError(
        `El documento debe tener entre ${MIN_LENGTH} y ${MAX_LENGTH} dígitos`,
      );
    }

    return new Documento(value);
  }
}
