import {
  JwtTokenService,
  parseDurationToSeconds,
} from '../../../src/modules/auth/infrastructure/services/JwtTokenService';
import { BcryptPasswordHasher } from '../../../src/modules/auth/infrastructure/services/BcryptPasswordHasher';

const ACCESS_SECRET = 'access_secret_for_tests_with_32_characters_min';
const REFRESH_SECRET = 'refresh_secret_for_tests_with_32_characters_min';

describe('JwtTokenService', () => {
  const service = new JwtTokenService(ACCESS_SECRET, REFRESH_SECRET, '15m', '7d');

  it('genera y verifica un access token con su payload', () => {
    const tokens = service.generateTokens({ userId: 'user-1', role: 'productor' });

    expect(tokens.expiresIn).toBe(900);
    const payload = service.verifyAccessToken(tokens.accessToken);
    expect(payload).toEqual({ userId: 'user-1', role: 'productor' });
  });

  it('genera y verifica un refresh token', () => {
    const tokens = service.generateTokens({ userId: 'user-2', role: 'comprador_b2c' });

    const payload = service.verifyRefreshToken(tokens.refreshToken);
    expect(payload.userId).toBe('user-2');
    expect(payload.role).toBe('comprador_b2c');
  });

  it('no acepta un access token como refresh token', () => {
    const tokens = service.generateTokens({ userId: 'user-3', role: 'administrador' });

    expect(() => service.verifyRefreshToken(tokens.accessToken)).toThrow('Token inválido');
  });

  it('rechaza tokens con firma de otro secreto', () => {
    const other = new JwtTokenService('otro_secreto_de_32_caracteres_para_pruebas', REFRESH_SECRET, '15m', '7d');
    const tokens = other.generateTokens({ userId: 'user-4', role: 'productor' });

    expect(() => service.verifyAccessToken(tokens.accessToken)).toThrow('Token inválido');
  });

  it('rechaza tokens malformados', () => {
    expect(() => service.verifyAccessToken('no-es-un-jwt')).toThrow('Token inválido');
    expect(() => service.verifyRefreshToken('')).toThrow('Token inválido');
  });

  it('genera refresh tokens únicos aunque el payload se repita', () => {
    const first = service.generateTokens({ userId: 'user-5', role: 'productor' });
    const second = service.generateTokens({ userId: 'user-5', role: 'productor' });

    expect(first.refreshToken).not.toBe(second.refreshToken);
    expect(service.hashToken(first.refreshToken)).not.toBe(
      service.hashToken(second.refreshToken),
    );
  });

  it('calcula el hash SHA-256 estable de un token', () => {
    const first = service.hashToken('token-de-prueba');
    const second = service.hashToken('token-de-prueba');

    expect(first).toBe(second);
    expect(first).toHaveLength(64);
    expect(first).not.toContain('token-de-prueba');
  });

  it('calcula la fecha de expiración del refresh en el futuro', () => {
    const expiresAt = service.refreshExpirationDate();
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

describe('parseDurationToSeconds', () => {
  it('convierte unidades de tiempo a segundos', () => {
    expect(parseDurationToSeconds('15m')).toBe(900);
    expect(parseDurationToSeconds('7d')).toBe(604_800);
    expect(parseDurationToSeconds('30s')).toBe(30);
    expect(parseDurationToSeconds('2h')).toBe(7_200);
  });

  it('rechaza formatos desconocidos', () => {
    expect(() => parseDurationToSeconds('15 minutos')).toThrow('inválido');
    expect(() => parseDurationToSeconds('m15')).toThrow('inválido');
  });
});

describe('BcryptPasswordHasher', () => {
  const hasher = new BcryptPasswordHasher(10);

  it('cifra la contraseña sin dejarla en texto plano', async () => {
    const hash = await hasher.hash('Agro2026*');

    expect(hash).not.toContain('Agro2026*');
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('verifica correctamente la contraseña cifrada', async () => {
    const hash = await hasher.hash('Agro2026*');

    await expect(hasher.compare('Agro2026*', hash)).resolves.toBe(true);
    await expect(hasher.compare('OtraClave123', hash)).resolves.toBe(false);
  });
});
