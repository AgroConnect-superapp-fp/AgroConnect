import { InvalidDataError } from '../errors/AuthErrors';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_LENGTH = 254;

export class Email {
  private constructor(readonly value: string) {}

  static create(raw: string): Email {
    const value = raw.trim().toLowerCase();

    if (value.length === 0) {
      throw new InvalidDataError('El correo es obligatorio');
    }

    if (value.length > MAX_LENGTH) {
      throw new InvalidDataError('El correo no puede superar los 254 caracteres');
    }

    if (!EMAIL_REGEX.test(value)) {
      throw new InvalidDataError('El correo no tiene un formato válido');
    }

    return new Email(value);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
