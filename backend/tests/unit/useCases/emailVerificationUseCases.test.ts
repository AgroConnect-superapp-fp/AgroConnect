import { InMemoryUserRepository } from '../../fakes/InMemoryUserRepository';
import { InMemoryEmailVerificationTokenRepository } from '../../fakes/InMemoryEmailVerificationTokenRepository';
import { FakeEmailService } from '../../fakes/FakeEmailService';
import { FakeTokenService } from '../../fakes/FakeTokenService';
import { RequestEmailVerificationUseCase } from '../../../src/modules/auth/application/useCases/RequestEmailVerificationUseCase';
import { VerifyEmailUseCase } from '../../../src/modules/auth/application/useCases/VerifyEmailUseCase';

const APP_BASE_URL = 'http://localhost:5173';

function buildSut() {
  const userRepository = new InMemoryUserRepository();
  const verificationRepository = new InMemoryEmailVerificationTokenRepository();
  const emailService = new FakeEmailService();
  const tokens = new FakeTokenService();

  return {
    userRepository,
    verificationRepository,
    emailService,
    requestVerification: new RequestEmailVerificationUseCase(
      userRepository,
      verificationRepository,
      emailService,
      tokens,
      APP_BASE_URL,
    ),
    verifyEmail: new VerifyEmailUseCase(userRepository, verificationRepository, tokens),
  };
}

function extractToken(sut: ReturnType<typeof buildSut>): string {
  const email = sut.emailService.sentVerifications.at(-1);
  if (!email) {
    throw new Error('No se envió ningún correo de verificación');
  }
  const token = new URL(email.verifyUrl).searchParams.get('verifyToken');
  if (!token) {
    throw new Error('El correo no contiene verifyToken');
  }
  return token;
}

describe('RequestEmailVerificationUseCase', () => {
  it('genera un token, lo almacena hasheado y envía el correo con el enlace', async () => {
    const sut = buildSut();
    sut.userRepository.seedUser({ email: 'maria.lopez@example.com' });

    await sut.requestVerification.execute({ correo: 'maria.lopez@example.com' });

    expect(sut.verificationRepository.tokens).toHaveLength(1);
    expect(sut.emailService.sentVerifications).toHaveLength(1);

    const email = sut.emailService.sentVerifications.at(-1);
    if (!email) {
      throw new Error('No se envió ningún correo de verificación');
    }
    expect(email.to).toBe('maria.lopez@example.com');

    const token = extractToken(sut);
    expect(sut.verificationRepository.tokens[0]?.tokenHash).toBe(`hash:${token}`);
    expect(email.verifyUrl.startsWith(APP_BASE_URL)).toBe(true);
  });

  it('no crea token ni envía correo si el usuario no existe', async () => {
    const sut = buildSut();

    await sut.requestVerification.execute({ correo: 'nadie@example.com' });

    expect(sut.verificationRepository.tokens).toHaveLength(0);
    expect(sut.emailService.sentVerifications).toHaveLength(0);
  });

  it('no envía correo si el usuario ya está verificado', async () => {
    const sut = buildSut();
    sut.userRepository.seedUser({
      email: 'verificado@example.com',
      emailVerifiedAt: new Date(),
    });

    await sut.requestVerification.execute({ correo: 'verificado@example.com' });

    expect(sut.verificationRepository.tokens).toHaveLength(0);
    expect(sut.emailService.sentVerifications).toHaveLength(0);
  });

  it('no envía correo a usuarios inactivos', async () => {
    const sut = buildSut();
    sut.userRepository.seedUser({
      email: 'suspendido@example.com',
      status: 'SUSPENDIDO',
    });

    await sut.requestVerification.execute({ correo: 'suspendido@example.com' });

    expect(sut.verificationRepository.tokens).toHaveLength(0);
    expect(sut.emailService.sentVerifications).toHaveLength(0);
  });

  it('invalida los tokens anteriores al reenviar la verificación', async () => {
    const sut = buildSut();
    sut.userRepository.seedUser({ email: 'maria.lopez@example.com' });

    await sut.requestVerification.execute({ correo: 'maria.lopez@example.com' });
    await sut.requestVerification.execute({ correo: 'maria.lopez@example.com' });

    const usables = sut.verificationRepository.tokens.filter((token) => token.usedAt === null);
    expect(sut.verificationRepository.tokens).toHaveLength(2);
    expect(usables).toHaveLength(1);
  });

  it('rechaza correos con formato inválido', async () => {
    const sut = buildSut();

    await expect(sut.requestVerification.execute({ correo: 'invalido' })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
  });
});

describe('VerifyEmailUseCase', () => {
  async function seedVerificationToken() {
    const sut = buildSut();
    sut.userRepository.seedUser({ email: 'maria.lopez@example.com' });
    await sut.requestVerification.execute({ correo: 'maria.lopez@example.com' });
    return { sut, token: extractToken(sut) };
  }

  it('marca el correo como verificado y consume el token', async () => {
    const { sut, token } = await seedVerificationToken();

    await sut.verifyEmail.execute({ token });

    expect(sut.userRepository.users[0]?.isEmailVerified()).toBe(true);
    expect(sut.verificationRepository.tokens[0]?.usedAt).not.toBeNull();
  });

  it('rechaza un token inexistente', async () => {
    const sut = buildSut();

    await expect(
      sut.verifyEmail.execute({ token: 'token-fantasma' }),
    ).rejects.toMatchObject({ code: 'TOKEN_INVALID', statusCode: 401 });
  });

  it('rechaza un token ya utilizado', async () => {
    const { sut, token } = await seedVerificationToken();
    await sut.verifyEmail.execute({ token });

    await expect(sut.verifyEmail.execute({ token })).rejects.toMatchObject({
      code: 'TOKEN_INVALID',
      statusCode: 401,
    });
  });

  it('rechaza un token expirado', async () => {
    const sut = buildSut();
    const user = sut.userRepository.seedUser({ email: 'maria.lopez@example.com' });
    await sut.verificationRepository.create({
      id: 'expirado',
      userId: user.id,
      tokenHash: 'hash:token-expirado',
      expiresAt: new Date(Date.now() - 1_000),
    });

    await expect(
      sut.verifyEmail.execute({ token: 'token-expirado' }),
    ).rejects.toMatchObject({ code: 'TOKEN_INVALID', statusCode: 401 });
  });
});
