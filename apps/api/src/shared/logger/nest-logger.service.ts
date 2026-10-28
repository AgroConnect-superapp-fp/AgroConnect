import { Injectable, type LoggerService } from '@nestjs/common';
import { logger } from './logger';

/**
 * Puente entre el logger interno de NestJS y Pino (SPEC §8).
 *
 * Evita `console.log` en producción: NestJS escribe sus mensajes de arranque
 * y de ciclo de vida a través de esta clase, que los delega a Pino con el
 * mismo formato estructurado del resto de la API.
 */
@Injectable()
export class PinoNestLogger implements LoggerService {
  log(message: unknown, ...optionalParams: unknown[]): void {
    logger.info({ context: 'nest', msg: message, params: optionalParams }, 'Nest');
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    logger.error({ context: 'nest', msg: message, params: optionalParams }, 'Nest');
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    logger.warn({ context: 'nest', msg: message, params: optionalParams }, 'Nest');
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    logger.debug({ context: 'nest', msg: message, params: optionalParams }, 'Nest');
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    logger.debug({ context: 'nest', msg: message, params: optionalParams }, 'Nest');
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    logger.fatal({ context: 'nest', msg: message, params: optionalParams }, 'Nest');
  }
}
