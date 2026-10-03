import type { PasswordHasher } from '../../src/modules/auth/domain/interfaces/PasswordHasher';

export class FakePasswordHasher implements PasswordHasher {
  hash(plainPassword: string): Promise<string> {
    return Promise.resolve(`hashed:${Buffer.from(plainPassword).toString('base64')}`);
  }

  compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    return Promise.resolve(
      passwordHash === `hashed:${Buffer.from(plainPassword).toString('base64')}`,
    );
  }
}
