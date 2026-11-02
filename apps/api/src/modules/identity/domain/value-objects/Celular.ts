import { InvalidDataError } from '../errors/AuthErrors';

const COLOMBIAN_MOBILE = /^3\d{9}$/;

export class Celular {
  private constructor(readonly value: string) {}

  static create(raw: string): Celular {
    const value = raw.replace(/[\s-]/g, '');

    if (!COLOMBIAN_MOBILE.test(value)) {
      throw new InvalidDataError(
        'El celular debe tener 10 dígitos y comenzar por 3 (formato Colombia)',
      );
    }

    return new Celular(value);
  }
}
