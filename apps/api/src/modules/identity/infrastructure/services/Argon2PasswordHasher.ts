import { Algorithm, hash, verify } from '@node-rs/argon2';
import bcrypt from 'bcryptjs';
import type { PasswordHasher } from '../../domain/interfaces/PasswordHasher';

/**
 * Argon2id (ADR-010) con migración transparente desde bcrypt.
 *
 * Parámetros OWASP para Argon2id: 19 MiB de memoria, 2 iteraciones y 1 hilo.
 * `compare` acepta ambos formatos: los hashes `$2b$` existentes se verifican
 * con bcrypt y `needsRehash` indica al LoginUseCase que los migre.
 */
const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export class Argon2PasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return hash(plainPassword, ARGON2_OPTIONS);
  }

  async compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    if (passwordHash.startsWith('$argon2')) {
      return verify(passwordHash, plainPassword);
    }

    if (passwordHash.startsWith('$2')) {
      return bcrypt.compare(plainPassword, passwordHash);
    }

    return false;
  }

  needsRehash(passwordHash: string): boolean {
    return !passwordHash.startsWith('$argon2id$');
  }
}
