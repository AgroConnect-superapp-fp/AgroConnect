import { InMemoryUserRepository } from '../../fakes/InMemoryUserRepository';
import { InMemoryPasswordResetTokenRepository } from '../../fakes/InMemoryPasswordResetTokenRepository';
import { FakeEmailService } from '../../fakes/FakeEmailService';
import { FakePasswordHasher } from '../../fakes/FakePasswordHasher';
import { FakeTokenService } from '../../fakes/FakeTokenService';
import { RegisterUserUseCase } from '../../../src/modules/auth/application/useCases/RegisterUserUseCase';
import { RequestPasswordResetUseCase } from '../../../src/modules/auth/application/useCases/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from '../../../src/modules/auth/application/useCases/ResetPasswordUseCase';
import type { RegisterUserInput } from '../../../src/modules/auth/application/dtos/authDtos';

const APP_BASE_URL = 'http://localhost:5173';

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
  },
  aceptaTratamientoDatos: true,
};

function buildSut() {
  const userRepository = new InMemoryUserRepository();
  const resetRepository = new InMemoryPasswordResetTokenRepository();
  const emailService = new FakeEmailService();
  const hasher = new FakePasswordHasher();
  const tokens = new FakeTokenService();

  return {
    userRepository,
    resetRepository,
    emailService,
    register: new RegisterUserUseCase(userRepository, hasher, tokens),
    requestReset: new RequestPasswordResetUseCase(
      userRepository,
      resetRepository,
      emailService,
      tokens,
      APP_BASE_URL,
    ),
    resetPassword: new ResetPasswordUseCase(userRepository, resetRepository, hasher, tokens),
  };
}

function extractToken(sut: ReturnType<typeof buildSut>): string {
  const email = sut.emailService.sent.at(-1);
  if (!email) {
    throw new Error('No se envió ningún correo de recuperación');
  }
  const token = new URL(email.resetUrl).searchParams.get('resetToken');
  if (!token) {
    throw new Error('El correo no contiene resetToken');
  }
  return token;
}

describe('RequestPasswordResetUseCase', () => {
  it('genera un token, lo almacena hasheado y envía el correo con el enlace', async () => {
    const sut = buildSut();
    await sut.register.execute(validProducerInput);

    await sut.requestReset.execute({ correo: 'maria.lopez@example.com' });

    expect(sut.resetRepository.tokens).toHaveLength(1);
    expect(sut.emailService.sent).toHaveLength(1);

    const email = sut.emailService.sent.at(-1);
    if (!email) {
      throw new Error('No se envió ningún correo de recuperación');
    }
    expect(email.to).toBe('maria.lopez@example.com');
    expect(email.fullName).toBe('María Fernanda López');

    const token = extractToken(sut);
    expect(sut.resetRepository.tokens[0]?.tokenHash).toBe(`hash:${token}`);
    expect(email.resetUrl.startsWith(APP_BASE_URL)).toBe(true);
  });

  it('no crea token ni envía correo si el usuario no existe (sin enumeración)', async () => {
    const sut = buildSut();

    await sut.requestReset.execute({ correo: 'nadie@example.com' });

    expect(sut.resetRepository.tokens).toHaveLength(0);
    expect(sut.emailService.sent).toHaveLength(0);
  });

  it('no envía correo a usuarios inactivos', async () => {
    const sut = buildSut();
    sut.userRepository.seedUser({
      email: 'suspendido@example.com',
      status: 'SUSPENDIDO',
    });

    await sut.requestReset.execute({ correo: 'suspendido@example.com' });

    expect(sut.resetRepository.tokens).toHaveLength(0);
    expect(sut.emailService.sent).toHaveLength(0);
  });

  it('invalida los tokens anteriores del usuario al solicitar uno nuevo', async () => {
    const sut = buildSut();
    await sut.register.execute(validProducerInput);

    await sut.requestReset.execute({ correo: 'maria.lopez@example.com' });
    await sut.requestReset.execute({ correo: 'maria.lopez@example.com' });

    const usable = sut.resetRepository.tokens.filter((token) => token.usedAt === null);
    expect(sut.resetRepository.tokens).toHaveLength(2);
    expect(usable).toHaveLength(1);
  });

  it('rechaza correos con formato inválido', async () => {
    const sut = buildSut();

    await expect(sut.requestReset.execute({ correo: 'invalido' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
  });
});

describe('ResetPasswordUseCase', () => {
  async function seedResetToken() {
    const sut = buildSut();
    await sut.register.execute(validProducerInput);
    await sut.requestReset.execute({ correo: 'maria.lopez@example.com' });
    return { sut, token: extractToken(sut) };
  }

  it('cambia la contraseña, marca el token como usado y revoca las sesiones', async () => {
    const { sut, token } = await seedResetToken();

    await sut.resetPassword.execute({ token, password: 'NuevaClave2026*' });

    const user = sut.userRepository.users[0];
    expect(user?.passwordHash).toBe(
      `hashed:${Buffer.from('NuevaClave2026*').toString('base64')}`,
    );
    expect(sut.resetRepository.tokens[0]?.usedAt).not.toBeNull();
    expect(sut.userRepository.refreshTokens.every((refresh) => refresh.revoked)).toBe(true);
  });

  it('rechaza un token inexistente', async () => {
    const sut = buildSut();

    await expect(
      sut.resetPassword.execute({ token: 'token-fantasma', password: 'NuevaClave2026*' }),
    ).rejects.toMatchObject({ code: 'TOKEN_INVALID', statusCode: 401 });
  });

  it('rechaza un token ya utilizado', async () => {
    const { sut, token } = await seedResetToken();
    await sut.resetPassword.execute({ token, password: 'NuevaClave2026*' });

    await expect(
      sut.resetPassword.execute({ token, password: 'OtraClave2026*' }),
    ).rejects.toMatchObject({ code: 'TOKEN_INVALID', statusCode: 401 });
  });

  it('rechaza un token expirado', async () => {
    const sut = buildSut();
    const user = sut.userRepository.seedUser({ email: 'maria.lopez@example.com' });
    await sut.resetRepository.create({
      id: 'expirado',
      userId: user.id,
      tokenHash: 'hash:token-expirado',
      expiresAt: new Date(Date.now() - 1_000),
    });

    await expect(
      sut.resetPassword.execute({ token: 'token-expirado', password: 'NuevaClave2026*' }),
    ).rejects.toMatchObject({ code: 'TOKEN_INVALID', statusCode: 401 });
  });

  it('rechaza contraseñas que no cumplen la política', async () => {
    const { sut, token } = await seedResetToken();

    await expect(
      sut.resetPassword.execute({ token, password: 'corta1' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
  });
});
