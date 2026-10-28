import { DomainError } from '../../../../shared/errors/errors';

/**
 * Errores de autenticación (copia del módulo legacy
 * `backend/src/modules/auth/domain/errors/AuthErrors.ts`).
 *
 * La única diferencia es la ruta del import: la clase base `DomainError` es la
 * de la API NestJS (`apps/api/src/shared/errors/errors.ts`), cuyo `ErrorCode`
 * incluye TODOS los códigos del legacy (`EMAIL_ALREADY_EXISTS`,
 * `DOCUMENT_ALREADY_EXISTS`, `PHONE_ALREADY_EXISTS`, `NIT_ALREADY_EXISTS`,
 * `ROLE_NOT_FOUND`, `ROLE_NOT_ALLOWED`, `USER_ALREADY_EXISTS`,
 * `INVALID_CREDENTIALS`, `TOKEN_INVALID`, `VALIDATION_ERROR`).
 *
 * NO se altera ningún código, mensaje ni status: son los mismos que el legacy
 * consume el frontend.
 */
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

export class RoleNotAllowedError extends DomainError {
  constructor(role: string) {
    super('ROLE_NOT_ALLOWED', `El rol "${role}" no está disponible para auto-registro`, 403);
  }
}

export class UserAlreadyExistsError extends DomainError {
  constructor() {
    super('USER_ALREADY_EXISTS', 'Ya existe un usuario con los datos suministrados', 409);
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
