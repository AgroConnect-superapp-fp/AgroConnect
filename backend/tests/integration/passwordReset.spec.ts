import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { prisma } from '../../src/shared/infrastructure/prisma';
import { FakeEmailService } from '../fakes/FakeEmailService';

const API = '/api/v1/auth';

let app: Express;
let emailService: FakeEmailService;

const validPayload = {
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

async function cleanDatabase(): Promise<void> {
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.producerProfile.deleteMany();
  await prisma.user.deleteMany();
}

beforeAll(() => {
  emailService = new FakeEmailService();
  app = createApp({ emailService });
});

beforeEach(async () => {
  emailService.sent = [];
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
});

describe(`Recuperación de contraseña — ${API}`, () => {
  it('flujo completo: solicitar → restablecer → login con la nueva contraseña', async () => {
    await request(app).post(`${API}/register`).send(validPayload).expect(201);

    const forgot = await request(app)
      .post(`${API}/forgot-password`)
      .send({ correo: validPayload.correo });

    expect(forgot.status).toBe(202);
    expect(emailService.sent).toHaveLength(1);

    const token = new URL(emailService.sent[0]?.resetUrl as string).searchParams.get('resetToken');
    expect(token).toBeTruthy();

    const reset = await request(app)
      .post(`${API}/reset-password`)
      .send({ token, password: 'NuevaClave2026*' });

    expect(reset.status).toBe(200);
    expect(reset.body.message).toBe('Contraseña actualizada correctamente');

    const loginNew = await request(app)
      .post(`${API}/login`)
      .send({ correo: validPayload.correo, password: 'NuevaClave2026*' });
    expect(loginNew.status).toBe(200);

    const loginOld = await request(app)
      .post(`${API}/login`)
      .send({ correo: validPayload.correo, password: validPayload.password });
    expect(loginOld.status).toBe(401);
  });

  it('persiste el token hasheado y el uso en PostgreSQL', async () => {
    await request(app).post(`${API}/register`).send(validPayload).expect(201);
    await request(app).post(`${API}/forgot-password`).send({ correo: validPayload.correo });

    const token = new URL(emailService.sent[0]?.resetUrl as string).searchParams.get(
      'resetToken',
    ) as string;

    const stored = await prisma.passwordResetToken.findFirst();
    expect(stored).not.toBeNull();
    expect(stored?.tokenHash).not.toBe(token);
    expect(stored?.tokenHash).toHaveLength(64);
    expect(stored?.usedAt).toBeNull();

    await request(app)
      .post(`${API}/reset-password`)
      .send({ token, password: 'NuevaClave2026*' })
      .expect(200);

    const used = await prisma.passwordResetToken.findFirst();
    expect(used?.usedAt).not.toBeNull();
  });

  it('no envía correo si el usuario no existe y responde 202 igual', async () => {
    const response = await request(app)
      .post(`${API}/forgot-password`)
      .send({ correo: 'nadie@example.com' });

    expect(response.status).toBe(202);
    expect(emailService.sent).toHaveLength(0);
  });

  it('rechaza un token inválido con 401 y código TOKEN_INVALID', async () => {
    const response = await request(app)
      .post(`${API}/reset-password`)
      .send({ token: 'token-invalido', password: 'NuevaClave2026*' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('TOKEN_INVALID');
  });

  it('rechaza la reutilización de un token ya consumido', async () => {
    await request(app).post(`${API}/register`).send(validPayload).expect(201);
    await request(app).post(`${API}/forgot-password`).send({ correo: validPayload.correo });

    const token = new URL(emailService.sent[0]?.resetUrl as string).searchParams.get(
      'resetToken',
    ) as string;

    await request(app)
      .post(`${API}/reset-password`)
      .send({ token, password: 'NuevaClave2026*' })
      .expect(200);

    const reuse = await request(app)
      .post(`${API}/reset-password`)
      .send({ token, password: 'OtraClave2026*' });

    expect(reuse.status).toBe(401);
  });

  it('valida el formato de la nueva contraseña con 422', async () => {
    const response = await request(app)
      .post(`${API}/reset-password`)
      .send({ token: 'cualquiera', password: 'corta' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('revoca las sesiones activas tras el restablecimiento', async () => {
    const registered = await request(app).post(`${API}/register`).send(validPayload).expect(201);
    const refreshToken = registered.body.data.tokens.refreshToken as string;

    await request(app).post(`${API}/forgot-password`).send({ correo: validPayload.correo });
    const token = new URL(emailService.sent[0]?.resetUrl as string).searchParams.get(
      'resetToken',
    ) as string;

    await request(app)
      .post(`${API}/reset-password`)
      .send({ token, password: 'NuevaClave2026*' })
      .expect(200);

    const refresh = await request(app).post(`${API}/refresh`).send({ refreshToken });
    expect(refresh.status).toBe(401);
  });
});
