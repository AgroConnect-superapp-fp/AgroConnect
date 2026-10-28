import type { Server } from 'node:http';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';

/**
 * Prueba e2e del módulo de identidad contra la base de datos real.
 *
 * A diferencia de la e2e de `/health`, aquí SÍ se usa el `PrismaService` real:
 * el registro, el login y la rotación de tokens persisten en PostgreSQL.
 * Requiere `agroconnect_test` con las migraciones aplicadas.
 */
describe('Identity (e2e)', () => {
  let app: NestExpressApplication;
  let server: Server;

  const unique = (): string => Math.random().toString(36).slice(2, 10);

  /** Lee el último correo escrito por el servicio de archivo y extrae su token. */
  const readTokenFromMail = async (kind: string, param: string): Promise<string> => {
    const dir = process.env.MAIL_DIR ?? '/tmp/agroconnect-mails-test';
    const files = (await readdir(dir)).filter((file) => file.endsWith(`-${kind}.txt`));
    expect(files.length).toBeGreaterThan(0);

    const latest = files.sort().at(-1) as string;
    const content = await readFile(join(dir, latest), 'utf8');
    const match = new RegExp(`${param}=([a-f0-9]+)`).exec(content);

    expect(match).not.toBeNull();
    const token = (match as RegExpExecArray)[1];
    if (!token) {
      throw new Error(`El correo de ${kind} no contiene el parámetro ${param}`);
    }
    return token;
  };

  const registerPayload = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
    nombre: 'Ana Rodríguez',
    documento: `10${Math.floor(1000000 + Math.random() * 8999999)}`,
    correo: `ana.${unique()}@agroconnect.co`,
    celular: `3${Math.floor(100000000 + Math.random() * 899999999)}`,
    password: 'ClaveSegura1',
    rol: 'productor',
    finca: {
      nombre: 'Finca La Esperanza',
      municipio: 'Armenia',
      vereda: 'El Progreso',
    },
    aceptaTratamientoDatos: true,
    ...overrides,
  });

  // La aplicación se levanta de nuevo en cada prueba: el storage del throttler
  // es en memoria y, de este modo, cada caso parte del límite intacto (el 429
  // queda así determinado y no depende del orden de ejecución).
  beforeEach(async () => {
    if (app) {
      await app.close();
    }

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    app.setGlobalPrefix('api/v1', { exclude: ['health'] });
    await app.init();
    server = app.getHttpServer() as Server;
  });

  afterAll(async () => {
    await app.close();
  });

  it('registra un usuario y entrega la sesión en cookies httpOnly', async () => {
    const payload = registerPayload();

    const response = await request(server).post('/api/v1/auth/register').send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Registro exitoso',
      data: {
        usuario: { correo: payload.correo, rol: 'productor' },
      },
    });
    expect(response.body.data.tokens.accessToken).toEqual(expect.any(String));

    const cookies = response.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((cookie) => cookie.startsWith('access_token='))).toBe(true);
    expect(cookies.some((cookie) => cookie.startsWith('refresh_token='))).toBe(true);
    expect(cookies.every((cookie) => cookie.includes('HttpOnly'))).toBe(true);
  });

  it('rechaza con 409 un correo ya registrado', async () => {
    const payload = registerPayload();
    const first = await request(server).post('/api/v1/auth/register').send(payload);
    expect(first.status).toBe(201);

    const second = await request(server)
      .post('/api/v1/auth/register')
      .send(registerPayload({ correo: payload.correo }));

    expect(second.status).toBe(409);
    expect(second.body).toMatchObject({ success: false, error: { code: 'EMAIL_ALREADY_EXISTS' } });
  });

  it('rechaza con 422 el auto-registro de administrador (lo bloquea el contrato compartido)', async () => {
    const response = await request(server)
      .post('/api/v1/auth/register')
      .send(registerPayload({ rol: 'administrador' }));

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({ success: false, error: { code: 'VALIDATION_ERROR' } });
  });

  it('rechaza con 401 unas credenciales inválidas', async () => {
    const response = await request(server)
      .post('/api/v1/auth/login')
      .send({ correo: 'nadie@agroconnect.co', password: 'ClaveIncorrecta1' });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, error: { code: 'INVALID_CREDENTIALS' } });
  });

  it('renueva la sesión con el token leído de la cookie httpOnly', async () => {
    const agent = request.agent(server);
    const payload = registerPayload();

    const registered = await agent.post('/api/v1/auth/register').send(payload);
    expect(registered.status).toBe(201);

    // Sin refreshToken en el cuerpo: el interceptor lo toma de la cookie.
    const refreshed = await agent.post('/api/v1/auth/refresh').send({});

    expect(refreshed.status).toBe(200);
    expect(refreshed.body).toMatchObject({ success: true, message: 'Token renovado' });
    expect(refreshed.body.data.tokens.accessToken).toEqual(expect.any(String));
  });

  it('cierra la sesión y limpia las cookies', async () => {
    const agent = request.agent(server);
    const payload = registerPayload();

    const registered = await agent.post('/api/v1/auth/register').send(payload);
    expect(registered.status).toBe(201);

    const loggedOut = await agent.post('/api/v1/auth/logout').send({});

    expect(loggedOut.status).toBe(204);

    const cookies = loggedOut.headers['set-cookie'] as unknown as string[] | undefined;
    expect(cookies?.some((cookie) => cookie.includes('access_token='))).toBe(true);
    // Express revoca la cookie con `Expires` en el pasado (no usa Max-Age).
    expect(cookies?.some((cookie) => cookie.includes('Expires=Thu, 01 Jan 1970'))).toBe(true);
  });

  it('limita los intentos y responde 429 con el cuerpo esperado', async () => {
    const credentials = { correo: `intentos.${unique()}@agroconnect.co`, password: 'ClaveSegura1' };

    let sawRateLimit = false;
    for (let attempt = 0; attempt < 12 && !sawRateLimit; attempt += 1) {
      const response = await request(server).post('/api/v1/auth/login').send(credentials);
      if (response.status === 429) {
        sawRateLimit = true;
        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Demasiados intentos. Intente de nuevo más tarde.',
          },
        });
      }
    }

    expect(sawRateLimit).toBe(true);
  });
  it('responde 202 al solicitar el restablecimiento de contraseña', async () => {
    const payload = registerPayload();

    const registered = await request(server).post('/api/v1/auth/register').send(payload);
    expect(registered.status).toBe(201);

    const response = await request(server)
      .post('/api/v1/auth/forgot-password')
      .send({ correo: payload.correo });

    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña',
    });
  });

  it('responde 202 también si el correo no está registrado (no revela información)', async () => {
    const response = await request(server)
      .post('/api/v1/auth/forgot-password')
      .send({ correo: `nadie.${unique()}@agroconnect.co` });

    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({ success: true });
  });

  it('responde 202 al reenviar el correo de verificación', async () => {
    const payload = registerPayload();

    const registered = await request(server).post('/api/v1/auth/register').send(payload);
    expect(registered.status).toBe(201);

    const response = await request(server)
      .post('/api/v1/auth/resend-verification')
      .send({ correo: payload.correo });

    expect(response.status).toBe(202);
    expect(response.body).toMatchObject({ success: true });
  });

  it('rechaza con 401 un enlace de restablecimiento inválido', async () => {
    const response = await request(server)
      .post('/api/v1/auth/reset-password')
      .send({ token: 'token-inexistente', password: 'NuevaClaveSegura1' });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, error: { code: 'TOKEN_INVALID' } });
  });

  it('rechaza con 401 un enlace de verificación inválido', async () => {
    const response = await request(server)
      .post('/api/v1/auth/verify-email')
      .send({ token: 'token-inexistente' });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, error: { code: 'TOKEN_INVALID' } });
  });
  it('restablece la contraseña con el token recibido por correo y permite iniciar sesión', async () => {
    const payload = registerPayload();
    expect((await request(server).post('/api/v1/auth/register').send(payload)).status).toBe(201);

    const forgot = await request(server)
      .post('/api/v1/auth/forgot-password')
      .send({ correo: payload.correo });
    expect(forgot.status).toBe(202);

    const token = await readTokenFromMail('password-reset', 'resetToken');

    const reset = await request(server)
      .post('/api/v1/auth/reset-password')
      .send({ token, password: 'NuevaClaveSegura2' });
    expect(reset.status).toBe(200);
    expect(reset.body).toMatchObject({ success: true, message: 'Contraseña actualizada correctamente' });

    const login = await request(server)
      .post('/api/v1/auth/login')
      .send({ correo: payload.correo, password: 'NuevaClaveSegura2' });
    expect(login.status).toBe(200);

    const loginConClaveVieja = await request(server)
      .post('/api/v1/auth/login')
      .send({ correo: payload.correo, password: 'ClaveSegura1' });
    expect(loginConClaveVieja.status).toBe(401);
  });

  it('verifica el correo con el token recibido y no admite reutilizarlo', async () => {
    const payload = registerPayload();
    expect((await request(server).post('/api/v1/auth/register').send(payload)).status).toBe(201);

    const token = await readTokenFromMail('email-verification', 'verifyToken');

    const verified = await request(server).post('/api/v1/auth/verify-email').send({ token });
    expect(verified.status).toBe(200);
    expect(verified.body).toMatchObject({ success: true, message: 'Correo verificado correctamente' });

    // El token es de un solo uso: al reutilizarlo debe rechazarse.
    const reutilizado = await request(server).post('/api/v1/auth/verify-email').send({ token });
    expect(reutilizado.status).toBe(401);
    expect(reutilizado.body).toMatchObject({ success: false, error: { code: 'TOKEN_INVALID' } });
  });
  it('rechaza con 409 un documento ya registrado', async () => {
    const payload = registerPayload();
    expect((await request(server).post('/api/v1/auth/register').send(payload)).status).toBe(201);

    const segundo = await request(server)
      .post('/api/v1/auth/register')
      .send(registerPayload({ documento: payload.documento }));

    expect(segundo.status).toBe(409);
    expect(segundo.body).toMatchObject({ success: false, error: { code: 'DOCUMENT_ALREADY_EXISTS' } });
  });

  it('rechaza con 409 un celular ya registrado', async () => {
    const payload = registerPayload();
    expect((await request(server).post('/api/v1/auth/register').send(payload)).status).toBe(201);

    const segundo = await request(server)
      .post('/api/v1/auth/register')
      .send(registerPayload({ celular: payload.celular }));

    expect(segundo.status).toBe(409);
    expect(segundo.body).toMatchObject({ success: false, error: { code: 'PHONE_ALREADY_EXISTS' } });
  });
});
