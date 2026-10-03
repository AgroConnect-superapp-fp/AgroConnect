export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'EMAIL_ALREADY_EXISTS'
  | 'DOCUMENT_ALREADY_EXISTS'
  | 'PHONE_ALREADY_EXISTS'
  | 'NIT_ALREADY_EXISTS'
  | 'ROLE_NOT_FOUND'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_INVALID'
  | 'RATE_LIMITED'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR';

export abstract class AppError extends Error {
  abstract readonly code: ErrorCode;
  abstract readonly statusCode: number;
  readonly details?: string[];

  constructor(message: string, details?: string[]) {
    super(message);
    this.name = new.target.name;
    this.details = details;
    Error.captureStackTrace(this, new.target);
  }
}

export class DomainError extends AppError {
  readonly code: ErrorCode;
  readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode = 400, details?: string[]) {
    super(message, details);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class ApplicationError extends AppError {
  readonly code: ErrorCode;
  readonly statusCode: number;

  constructor(code: ErrorCode, message: string, statusCode = 400, details?: string[]) {
    super(message, details);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class InfrastructureError extends AppError {
  readonly code: ErrorCode;
  readonly statusCode: number;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.code = 'INTERNAL_ERROR';
    this.statusCode = 500;
    if (cause instanceof Error) {
      this.cause = cause;
    }
  }
}
