import bcrypt from 'bcryptjs';
import { Argon2PasswordHasher } from '../../../src/modules/identity/infrastructure/services/Argon2PasswordHasher';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  it('genera un hash Argon2id y lo verifica', async () => {
    const hash = await hasher.hash('ClaveSegura1');

    expect(hash.startsWith('$argon2id$')).toBe(true);
    await expect(hasher.compare('ClaveSegura1', hash)).resolves.toBe(true);
    await expect(hasher.compare('OtraClave1', hash)).resolves.toBe(false);
    expect(hasher.needsRehash(hash)).toBe(false);
  });

  it('verifica hashes bcrypt existentes y los marca para rehash', async () => {
    const legacyHash = await bcrypt.hash('ClaveSegura1', 10);

    await expect(hasher.compare('ClaveSegura1', legacyHash)).resolves.toBe(true);
    expect(hasher.needsRehash(legacyHash)).toBe(true);
  });

  it('rechaza un hash con formato desconocido', async () => {
    await expect(hasher.compare('ClaveSegura1', 'texto-plano')).resolves.toBe(false);
    expect(hasher.needsRehash('texto-plano')).toBe(true);
  });
});
