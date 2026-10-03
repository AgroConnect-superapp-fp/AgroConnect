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
  await prisma.emailVerificationToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.producerProfile.deleteMany();
  await prisma.user.deleteMany();
}

function lastVerificationToken(): string {
  const email = emailService.sentVerifications.at(-1);
  if (!email) {
    throw new Error('No se envió correo de verificación');
  }
  const token = new URL(email.verifyUrl).searchParams.get('verifyToken');
  if (!token) {
    throw new Error('El correo no contiene verifyToken');
  }
  return token;
}

beforeAll(() => {
  emailService = new FakeEmailService();
  app = createApp({ emailService });
});

beforeEach(async () => {
  emailService.sent = [];
  emailService.sentVerifications = [];
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
});

describe(`Verificación de correo — ${API}`, () => {
  it('el registro envía automáticamente el correo de verificación y marca verificado: false', async () => {
    const response = await request(app).post(`${API}/register`).send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body.data.usuario.verificado).toBe(false);
    expect(emailService.sentVerifications).toHaveLength(1);
    expect(emailService.sentVerifications[0]?.to).toBe(validPayload.correo);
  });

  it('flujo completo: registrar → verificar → persistir en PostgreSQL', async () => {
    await request(app).post(`${API}/register`).send(validPayload).expect(201);
    const token = lastVerificationToken();

    const verify = await request(app).post(`${API}/verify-email`).send({ token });

    expect(verify.status).toBe(200);
    expect(verify.body.message).toBe('Correo verificado correctamente');

    const row = await prisma.user.findUnique({ where: { email: validPayload.correo } });
    expect(row?.emailVerifiedAt).not.toBeNull();

    const stored = await prisma.emailVerificationToken.findFirst();
    expect(stored?.usedAt).not.toBeNull();
    expect(stored?.tokenHash).not.toBe(token);
  });

  it('el login posterior refleja verificado: true', async () => {
    await request(app).post(`${API}/register`).send(validPayload).expect(201);
    const token = lastVerificationToken();
    await request(app).post(`${API}/verify-email`).send({ token }).expect(200);

    const login = await request(app)
      .post(`${API}/login`)
      .send({ correo: validPayload.correo, password: validPayload.password });

    expect(login.status).toBe(200);
    expect(login.body.data.usuario.verificado).toBe(true);
  });

  it('rechaza un token inválido con 401', async () => {
    const response = await request(app)
      .post(`${API}/verify-email`)
      .send({ token: 'token-invalido' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('TOKEN_INVALID');
  });

  it('rechaza la reutilización del token de verificación', async () => {
    await request(app).post(`${API}/register`).send(validPayload).expect(201);
    const token = lastVerificationToken();
    await request(app).post(`${API}/verify-email`).send({ token }).expect(200);

    const reuse = await request(app).post(`${API}/verify-email`).send({ token });
    expect(reuse.status).toBe(401);
  });

  it('resend-verification responde 202 y reenvía si el correo no está verificado', async () => {
    await request(app).post(`${API}/register`).send(validPayload).expect(201);
    emailService.sentVerifications = [];

    const response = await request(app)
      .post(`${API}/resend-verification`)
      .send({ correo: validPayload.correo });

    expect(response.status).toBe(202);
    expect(emailService.sentVerifications).toHaveLength(1);
  });

  it('resend-verification no envía correo si el usuario no existe (202 igual)', async () => {
    const response = await request(app)
      .post(`${API}/resend-verification`)
      .send({ correo: 'nadie@example.com' });

    expect(response.status).toBe(202);
    expect(emailService.sentVerifications).toHaveLength(0);
  });

  it('resend-verification no envía correo si el usuario ya está verificado', async () => {
    await request(app).post(`${API}/register`).send(validPayload).expect(201);
    const token = lastVerificationToken();
    await request(app).post(`${API}/verify-email`).send({ token }).expect(200);
    emailService.sentVerifications = [];

    const response = await request(app)
      .post(`${API}/resend-verification`)
      .send({ correo: validPayload.correo });

    expect(response.status).toBe(202);
    expect(emailService.sentVerifications).toHaveLength(0);
  });
});
