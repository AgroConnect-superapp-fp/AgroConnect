import { InMemoryUserRepository } from '../../fakes/InMemoryUserRepository';
import { FakePasswordHasher } from '../../fakes/FakePasswordHasher';
import { FakeTokenService } from '../../fakes/FakeTokenService';
import { RegisterUserUseCase } from '../../../src/modules/auth/application/useCases/RegisterUserUseCase';
import { LoginUseCase } from '../../../src/modules/auth/application/useCases/LoginUseCase';
import { RefreshTokenUseCase } from '../../../src/modules/auth/application/useCases/RefreshTokenUseCase';
import { LogoutUseCase } from '../../../src/modules/auth/application/useCases/LogoutUseCase';
import type { RegisterUserInput } from '../../../src/modules/auth/application/dtos/authDtos';

const validProducerInput: RegisterUserInput = {
  nombre: 'María Fernanda López',
  documento: '1098765432',
  correo: 'maria.lopez@example.com',
  celular: '3105557788',
  password: 'Agro2026*',
  rol: 'productor',
  finca: {
    nombre: 'El Mirador',
    municipio: 'Salento',
    vereda: 'Boquía',
    latitud: 4.6371,
    longitud: -75.5703,
  },
  aceptaTratamientoDatos: true,
};

function buildSut() {
  const repository = new InMemoryUserRepository();
  const hasher = new FakePasswordHasher();
  const tokens = new FakeTokenService();

  return {
    repository,
    hasher,
    tokens,
    register: new RegisterUserUseCase(repository, hasher, tokens),
    login: new LoginUseCase(repository, hasher, tokens),
    refresh: new RefreshTokenUseCase(repository, tokens),
    logout: new LogoutUseCase(repository, tokens),
  };
}

describe('RegisterUserUseCase', () => {
  it('registra un productor con su finca, cifra la contraseña y emite tokens', async () => {
    const sut = buildSut();

    const result = await sut.register.execute(validProducerInput);

    expect(result.user.nombre).toBe('María Fernanda López');
    expect(result.user.rol).toBe('productor');
    expect(result.user.correo).toBe('maria.lopez@example.com');
    expect(result.tokens.accessToken).toBeTruthy();
    expect(result.tokens.refreshToken).toBeTruthy();

    const stored = sut.repository.users[0];
    expect(stored?.passwordHash.startsWith('hashed:')).toBe(true);
    expect(stored?.passwordHash).not.toContain('Agro2026*');
    expect(sut.repository.producerProfiles.get(result.user.id)?.farmName).toBe('El Mirador');
    expect(sut.repository.refreshTokens).toHaveLength(1);
  });

  it('normaliza el correo a minúsculas', async () => {
    const sut = buildSut();
    const result = await sut.register.execute({
      ...validProducerInput,
      correo: 'MARIA.LOPEZ@EXAMPLE.COM',
    });

    expect(result.user.correo).toBe('maria.lopez@example.com');
  });

  it('registra una empresa con su perfil empresarial', async () => {
    const sut = buildSut();
    const result = await sut.register.execute({
      ...validProducerInput,
      correo: 'compras@frutasquindio.com',
      celular: '3112223344',
      documento: '9012345678',
      rol: 'comprador_b2b',
      finca: undefined,
      empresa: {
        razonSocial: 'Frutas del Quindío S.A.S.',
        nit: '901234567-8',
        direccion: 'Calle 12 # 4-56, Armenia',
      },
    });

    expect(result.user.rol).toBe('comprador_b2b');
    expect(sut.repository.companyProfiles.get(result.user.id)?.companyName).toBe(
      'Frutas del Quindío S.A.S.',
    );
  });

  it('rechaza correo duplicado con EMAIL_ALREADY_EXISTS', async () => {
    const sut = buildSut();
    await sut.register.execute(validProducerInput);

    await expect(
      sut.register.execute({
        ...validProducerInput,
        documento: '999888777',
        celular: '3105557799',
      }),
    ).rejects.toMatchObject({ code: 'EMAIL_ALREADY_EXISTS', statusCode: 409 });
  });

  it('rechaza documento duplicado con DOCUMENT_ALREADY_EXISTS', async () => {
    const sut = buildSut();
    await sut.register.execute(validProducerInput);

    await expect(
      sut.register.execute({
        ...validProducerInput,
        correo: 'otra@example.com',
        celular: '3105557799',
      }),
    ).rejects.toMatchObject({ code: 'DOCUMENT_ALREADY_EXISTS', statusCode: 409 });
  });

  it('rechaza celular duplicado con PHONE_ALREADY_EXISTS', async () => {
    const sut = buildSut();
    await sut.register.execute(validProducerInput);

    await expect(
      sut.register.execute({
        ...validProducerInput,
        correo: 'otra@example.com',
        documento: '999888777',
      }),
    ).rejects.toMatchObject({ code: 'PHONE_ALREADY_EXISTS', statusCode: 409 });
  });

  it('rechaza un rol inexistente con ROLE_NOT_FOUND', async () => {
    const sut = buildSut();

    await expect(
      sut.register.execute({ ...validProducerInput, rol: 'vendedor' as never }),
    ).rejects.toMatchObject({ code: 'ROLE_NOT_FOUND', statusCode: 422 });
  });

  it('exige los datos de la finca al rol productor', async () => {
    const sut = buildSut();

    await expect(
      sut.register.execute({ ...validProducerInput, finca: undefined }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
  });

  it('exige los datos de la empresa al rol de empresa', async () => {
    const sut = buildSut();

    await expect(
      sut.register.execute({ ...validProducerInput, rol: 'comprador_b2b' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
  });

  it('rechaza el registro sin autorización de tratamiento de datos', async () => {
    const sut = buildSut();

    await expect(
      sut.register.execute({ ...validProducerInput, aceptaTratamientoDatos: false }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
  });

  it('rechaza contraseñas débiles', async () => {
    const sut = buildSut();

    await expect(
      sut.register.execute({ ...validProducerInput, password: 'corta1' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
  });

  it('rechaza nombres demasiado cortos', async () => {
    const sut = buildSut();

    await expect(
      sut.register.execute({ ...validProducerInput, nombre: 'Ab' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
  });
});

describe('LoginUseCase', () => {
  async function seedRegisteredUser() {
    const sut = buildSut();
    await sut.register.execute(validProducerInput);
    return sut;
  }

  it('autentica con credenciales válidas y registra el refresh token', async () => {
    const sut = await seedRegisteredUser();

    const result = await sut.login.execute({
      correo: 'maria.lopez@example.com',
      password: 'Agro2026*',
    });

    expect(result.user.rol).toBe('productor');
    expect(result.tokens.accessToken).toContain(result.user.id);
    expect(sut.repository.refreshTokens).toHaveLength(2);
  });

  it('rechaza credenciales con correo inexistente', async () => {
    const sut = await seedRegisteredUser();

    await expect(
      sut.login.execute({ correo: 'nadie@example.com', password: 'Agro2026*' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
  });

  it('rechaza credenciales con contraseña incorrecta', async () => {
    const sut = await seedRegisteredUser();

    await expect(
      sut.login.execute({ correo: 'maria.lopez@example.com', password: 'OtraClave123' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
  });

  it('rechaza usuarios inactivos sin revelar el motivo', async () => {
    const sut = buildSut();
    sut.repository.seedUser({
      email: 'inactivo@example.com',
      passwordHash: `hashed:${Buffer.from('Agro2026*').toString('base64')}`,
      status: 'SUSPENDIDO',
    });

    await expect(
      sut.login.execute({ correo: 'inactivo@example.com', password: 'Agro2026*' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS', statusCode: 401 });
  });

  it('rechaza correos con formato inválido', async () => {
    const sut = buildSut();

    await expect(
      sut.login.execute({ correo: 'sin-arroba', password: 'Agro2026*' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
  });
});

describe('RefreshTokenUseCase', () => {
  async function seedLoggedUser() {
    const sut = buildSut();
    await sut.register.execute(validProducerInput);
    const login = await sut.login.execute({
      correo: 'maria.lopez@example.com',
      password: 'Agro2026*',
    });
    return { sut, refreshToken: login.tokens.refreshToken };
  }

  it('rota el refresh token y emite un par nuevo', async () => {
    const { sut, refreshToken } = await seedLoggedUser();

    const tokens = await sut.refresh.execute({ refreshToken });

    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).not.toBe(refreshToken);

    const previous = sut.repository.refreshTokens.find(
      (token) => token.tokenHash === `hash:${refreshToken}`,
    );
    const renewed = sut.repository.refreshTokens.find(
      (token) => token.tokenHash === `hash:${tokens.refreshToken}`,
    );

    expect(previous?.revoked).toBe(true);
    expect(renewed?.revoked).toBe(false);
  });

  it('rechaza un refresh token con formato inválido', async () => {
    const sut = buildSut();

    await expect(sut.refresh.execute({ refreshToken: 'token-invalido' })).rejects.toMatchObject({
      code: 'TOKEN_INVALID',
      statusCode: 401,
    });
  });

  it('rechaza un refresh token no registrado', async () => {
    const { sut } = await seedLoggedUser();

    await expect(
      sut.refresh.execute({ refreshToken: 'refresh:usuario-fantasma:99' }),
    ).rejects.toMatchObject({ code: 'TOKEN_INVALID', statusCode: 401 });
  });

  it('rechaza un refresh token revocado', async () => {
    const { sut, refreshToken } = await seedLoggedUser();
    await sut.refresh.execute({ refreshToken });

    await expect(sut.refresh.execute({ refreshToken })).rejects.toMatchObject({
      code: 'TOKEN_INVALID',
      statusCode: 401,
    });
  });

  it('rechaza un refresh token expirado', async () => {
    const { sut, refreshToken } = await seedLoggedUser();
    const stored = sut.repository.refreshTokens.find(
      (token) => token.tokenHash === `hash:${refreshToken}`,
    );
    if (stored) {
      sut.repository.refreshTokens = sut.repository.refreshTokens.filter(
        (token) => token.id !== stored.id,
      );
      sut.repository.seedRefreshToken(
        stored.userId,
        stored.tokenHash,
        new Date(Date.now() - 1_000),
      );
    }

    await expect(sut.refresh.execute({ refreshToken })).rejects.toMatchObject({
      code: 'TOKEN_INVALID',
      statusCode: 401,
    });
  });

  it('rechaza la renovación de un usuario inactivo', async () => {
    const sut = buildSut();
    const user = sut.repository.seedUser({
      email: 'inactivo@example.com',
      status: 'SUSPENDIDO',
    });
    const refreshToken = `refresh:${user.id}:1`;
    sut.repository.seedRefreshToken(user.id, `hash:${refreshToken}`, new Date(Date.now() + 60_000));

    await expect(sut.refresh.execute({ refreshToken })).rejects.toMatchObject({
      code: 'TOKEN_INVALID',
      statusCode: 401,
    });
  });
});

describe('LogoutUseCase', () => {
  it('revoca el refresh token emitido', async () => {
    const sut = buildSut();
    await sut.register.execute(validProducerInput);
    const login = await sut.login.execute({
      correo: 'maria.lopez@example.com',
      password: 'Agro2026*',
    });

    await sut.logout.execute({ refreshToken: login.tokens.refreshToken });

    const stored = sut.repository.refreshTokens.find(
      (token) => token.tokenHash === `hash:${login.tokens.refreshToken}`,
    );
    expect(stored?.revoked).toBe(true);
  });

  it('es idempotente con tokens inválidos', async () => {
    const sut = buildSut();

    await expect(sut.logout.execute({ refreshToken: 'token-invalido' })).resolves.toBeUndefined();
  });

  it('es idempotente con tokens no registrados', async () => {
    const sut = buildSut();

    await expect(
      sut.logout.execute({ refreshToken: 'refresh:usuario:1' }),
    ).resolves.toBeUndefined();
  });
});
