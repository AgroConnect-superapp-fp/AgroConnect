import jwt from 'jsonwebtoken';
import {
  JwtTokenService,
  parseDurationToSeconds,
} from '../../../src/modules/identity/infrastructure/services/JwtTokenService';
import { InvalidTokenError } from '../../../src/modules/identity/domain/errors/AuthErrors';

const ACCESS_SECRET = 'a'.repeat(32);
const REFRESH_SECRET = 'b'.repeat(32);

describe('JwtTokenService', () => {
  const service = new JwtTokenService(ACCESS_SECRET, REFRESH_SECRET, '15m', '7d');

  it('genera un par de tokens con el algoritmo y la expiración configurados', () => {
    const tokens = service.generateTokens({ userId: 'usuario-1', role: 'productor' });

    expect(tokens.expiresIn).toBe(900);
    expect(tokens.accessToken).not.toEqual(tokens.refreshToken);

    const access = jwt.decode(tokens.accessToken) as { sub: string; role: string; exp: number };
    const refresh = jwt.decode(tokens.refreshToken) as { sub: string; type: string; jti: string };

    expect(access.sub).toBe('usuario-1');
    expect(access.role).toBe('productor');
    expect(refresh.type).toBe('refresh');
    // `jwtid` se materializa como el claim estándar `jti`.
    expect(refresh.jti).toEqual(expect.any(String));
  });

  it('verifica el token de acceso y devuelve su carga útil', () => {
    const { accessToken } = service.generateTokens({ userId: 'usuario-1', role: 'comprador_b2c' });

    expect(service.verifyAccessToken(accessToken)).toEqual({
      userId: 'usuario-1',
      role: 'comprador_b2c',
    });
  });

  it('rechaza un token de acceso firmado con otro secreto', () => {
    const otro = new JwtTokenService('c'.repeat(32), REFRESH_SECRET, '15m', '7d');
    const { accessToken } = otro.generateTokens({ userId: 'usuario-1', role: 'productor' });

    expect(() => service.verifyAccessToken(accessToken)).toThrow(InvalidTokenError);
  });

  it('rechaza un token con firma inválida', () => {
    expect(() => service.verifyAccessToken('token.invalido')).toThrow(InvalidTokenError);
  });

  it('rechaza un token de acceso expirado', () => {
    const expirado = jwt.sign({ role: 'productor' }, ACCESS_SECRET, {
      algorithm: 'HS256',
      subject: 'usuario-1',
      expiresIn: -10,
    });

    expect(() => service.verifyAccessToken(expirado)).toThrow(InvalidTokenError);
  });

  it('rechaza un token cuyo rol no existe en el dominio', () => {
    const invalido = jwt.sign({ role: 'rol_inventado' }, ACCESS_SECRET, {
      algorithm: 'HS256',
      subject: 'usuario-1',
      expiresIn: 900,
    });

    expect(() => service.verifyAccessToken(invalido)).toThrow(InvalidTokenError);
  });

  it('verifica el token de refresco', () => {
    const { refreshToken } = service.generateTokens({ userId: 'usuario-2', role: 'transportista' });

    expect(service.verifyRefreshToken(refreshToken)).toEqual({
      userId: 'usuario-2',
      role: 'transportista',
    });
  });

  it('rechaza como refresh un token de acceso', () => {
    const { accessToken } = service.generateTokens({ userId: 'usuario-1', role: 'productor' });

    expect(() => service.verifyRefreshToken(accessToken)).toThrow(InvalidTokenError);
  });

  it('hashea el token de forma determinista y sin exponerlo en claro', () => {
    const hash = service.hashToken('token-en-claro');

    expect(hash).toHaveLength(64);
    expect(hash).toBe(service.hashToken('token-en-claro'));
    expect(hash).not.toContain('token-en-claro');
  });

  it('calcula la fecha de expiración del refresh a partir de la duración configurada', () => {
    const expiresAt = service.refreshExpirationDate();
    const dias = (expiresAt.getTime() - Date.now()) / 86_400_000;

    expect(dias).toBeGreaterThan(6.9);
    expect(dias).toBeLessThan(7.1);
  });
});

describe('parseDurationToSeconds', () => {
  it('convierte las unidades soportadas a segundos', () => {
    expect(parseDurationToSeconds('30s')).toBe(30);
    expect(parseDurationToSeconds('15m')).toBe(900);
    expect(parseDurationToSeconds('2h')).toBe(7200);
    expect(parseDurationToSeconds('7d')).toBe(604800);
  });

  it('tolera espacios alrededor del valor', () => {
    expect(parseDurationToSeconds(' 15m ')).toBe(900);
  });

  it('lanza un error con un formato no soportado', () => {
    expect(() => parseDurationToSeconds('15 minutos')).toThrow(/Formato de duración inválido/);
    expect(() => parseDurationToSeconds('15')).toThrow(/Formato de duración inválido/);
  });
});
