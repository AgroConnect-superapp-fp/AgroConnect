import { envSchema, parseEnv } from '../../../src/shared/config/env';

const MINIMO_VALIDO = {
  DATABASE_URL: 'postgresql://agroconnect:agroconnect_dev@localhost:5434/agroconnect_test',
  JWT_ACCESS_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('configuración de entorno', () => {
  it('aplica los valores por defecto que usa el backend legacy', () => {
    const env = parseEnv(MINIMO_VALIDO);

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(4000);
    expect(env.DATABASE_SCHEMA).toBe('public');
    expect(env.JWT_ACCESS_EXPIRES_IN).toBe('15m');
    expect(env.JWT_REFRESH_EXPIRES_IN).toBe('7d');
    expect(env.RATE_LIMIT_WINDOW_MS).toBe(900_000);
    expect(env.RATE_LIMIT_MAX_ATTEMPTS).toBe(5);
    expect(env.TRUST_PROXY).toBe(0);
    expect(env.LOG_LEVEL).toBe('info');
  });

  it('convierte a número los valores que llegan como texto', () => {
    const env = parseEnv({
      ...MINIMO_VALIDO,
      PORT: '4100',
      TRUST_PROXY: '1',
      BCRYPT_SALT_ROUNDS: '10',
      RATE_LIMIT_MAX_ATTEMPTS: '30',
    });

    expect(env.PORT).toBe(4100);
    expect(env.TRUST_PROXY).toBe(1);
    expect(env.BCRYPT_SALT_ROUNDS).toBe(10);
    expect(env.RATE_LIMIT_MAX_ATTEMPTS).toBe(30);
  });

  it('enumera los problemas cuando falta una variable obligatoria', () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
    expect(() => parseEnv({})).toThrow(/JWT_ACCESS_SECRET/);
    expect(() => parseEnv({})).toThrow(/JWT_REFRESH_SECRET/);
  });

  it('rechaza secretos de menos de 32 caracteres', () => {
    expect(() =>
      parseEnv({ ...MINIMO_VALIDO, JWT_ACCESS_SECRET: 'corto' }),
    ).toThrow(/al menos 32 caracteres/);
  });

  it('rechaza un NODE_ENV desconocido', () => {
    expect(() => parseEnv({ ...MINIMO_VALIDO, NODE_ENV: 'produccion' })).toThrow();
  });

  it('rechaza un APP_BASE_URL que no es URL', () => {
    expect(() => parseEnv({ ...MINIMO_VALIDO, APP_BASE_URL: 'no-es-una-url' })).toThrow();
  });

  it('expone el esquema para reutilizarlo en otros puntos', () => {
    const resultado = envSchema.safeParse(MINIMO_VALIDO);
    expect(resultado.success).toBe(true);
  });
});
