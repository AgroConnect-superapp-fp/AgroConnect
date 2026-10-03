import { DomainError } from '../../../../shared/domain/errors';

export class EmailAlreadyExistsError extends DomainError {
  constructor() {
    super('EMAIL_ALREADY_EXISTS', 'El correo ya se encuentra registrado', 409);
  }
}

export class DocumentAlreadyExistsError extends DomainError {
  constructor() {
    super('DOCUMENT_ALREADY_EXISTS', 'El documento ya se encuentra registrado', 409);
  }
}

export class PhoneAlreadyExistsError extends DomainError {
  constructor() {
    super('PHONE_ALREADY_EXISTS', 'El celular ya se encuentra registrado', 409);
  }
}

export class NitAlreadyExistsError extends DomainError {
  constructor() {
    super('NIT_ALREADY_EXISTS', 'El NIT ya se encuentra registrado', 409);
  }
}

export class RoleNotFoundError extends DomainError {
  constructor(role: string) {
    super('ROLE_NOT_FOUND', `El rol "${role}" no es válido`, 422);
  }
}

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos', 401);
  }
}

export class InvalidTokenError extends DomainError {
  constructor(message = 'Token inválido o expirado') {
    super('TOKEN_INVALID', message, 401);
  }
}

export class InvalidDataError extends DomainError {
  constructor(message: string, details?: string[]) {
    super('VALIDATION_ERROR', message, 422, details);
  }
}
