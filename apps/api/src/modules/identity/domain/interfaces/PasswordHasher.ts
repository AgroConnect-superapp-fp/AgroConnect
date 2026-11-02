export interface PasswordHasher {
  hash(plainPassword: string): Promise<string>;
  compare(plainPassword: string, passwordHash: string): Promise<boolean>;
  /** `true` si el hash es legacy (bcrypt) y debe rehashearse tras un login válido. */
  needsRehash(passwordHash: string): boolean;
}
