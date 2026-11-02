import type { PasswordHasher } from '../../src/modules/identity/domain/interfaces/PasswordHasher';

export class FakePasswordHasher implements PasswordHasher {
  needsRehashResult = false;
  hashCalls = 0;

  hash(plainPassword: string): Promise<string> {
    this.hashCalls += 1;
    return Promise.resolve(`hashed:${Buffer.from(plainPassword).toString('base64')}`);
  }

  compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    return Promise.resolve(
      passwordHash === `hashed:${Buffer.from(plainPassword).toString('base64')}`,
    );
  }

  needsRehash(): boolean {
    return this.needsRehashResult;
  }
}
