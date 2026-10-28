import { Inject, Injectable, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ThrottlerGuard, getOptionsToken, getStorageToken } from '@nestjs/throttler';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import type { ThrottlerStorage } from '@nestjs/throttler';
import { DomainError } from '../../../../shared/errors/errors';

/**
 * Rate limiting del módulo identity.
 *
 * Usa `@nestjs/throttler` (el límite y el TTL se fijan por ruta con el
 * decorador `@Throttle`) pero sustituye la excepción del throttle por un
 * `DomainError` de la aplicación: así el filtro global responde con el mismo
 * cuerpo que el backend legacy.
 *
 * La v6 de `@nestjs/throttler` aplica por defecto la máscara de subred IPv6
 * (/56) al generar la clave, de modo que un cliente IPv6 no puede evadir el
 * límite rotando direcciones.
 */
@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  constructor(
    @Inject(getOptionsToken()) options: ThrottlerModuleOptions,
    @Inject(getStorageToken()) storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected override throwThrottlingException(
    _context: ExecutionContext,
    _throttlerLimitDetail: unknown,
  ): Promise<void> {
    return Promise.reject(
      new DomainError('RATE_LIMITED', 'Demasiados intentos. Intente de nuevo más tarde.', 429),
    );
  }
}
