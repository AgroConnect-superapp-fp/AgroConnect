import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { prisma } from '../../src/shared/infrastructure/prisma';

const API = '/api/v1/auth';

let app: Express;

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
    latitud: 4.6371,
    longitud: -75.5703,
  },
  aceptaTratamientoDatos: true,
};

async function cleanDatabase(): Promise<void> {
  await prisma.refreshToken.deleteMany();
  await prisma.companyProfile.deleteMany();
  await prisma.producerProfile.deleteMany();
  await prisma.user.deleteMany();
}

beforeAll(() => {
  app = createApp();
});

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await cleanDatabase();
});

describe(`POST ${API}/register`, () => {
  it('registra un productor y devuelve 201 con datos públicos y tokens', async () => {
    const response = await request(app).post(`${API}/register`).send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Registro exitoso');
    expect(response.body.data.usuario).toMatchObject({
      nombre: 'María Fernanda López',
      correo: 'maria.lopez@example.com',
      rol: 'productor',
      estado: 'ACTIVO',
    });
    expect(response.body.data.usuario.id).toBeDefined();
    expect(response.body.data.tokens.accessToken).toBeTruthy();
    expect(response.body.data.tokens.refreshToken).toBeTruthy();
    expect(response.body.data.usuario.passwordHash).toBeUndefined();
  });

  it('persiste usuario, rol, perfil y refresh token en PostgreSQL', async () => {
    const response = await request(app).post(`${API}/register`).send(validPayload);
    const userId = response.body.data.usuario.id as string;

    const row = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true, producerProfile: true, refreshTokens: true },
    });

    expect(row).not.toBeNull();
    expect(row?.role.name).toBe('productor');
    expect(row?.passwordHash.startsWith('$2')).toBe(true);
    expect(row?.passwordHash).not.toContain('Agro2026*');
    expect(row?.producerProfile?.farmName).toBe('El Mirador');
    expect(row?.refreshTokens).toHaveLength(1);
  });

  it('almacena las coordenadas de la finca con PostGIS', async () => {
    const response = await request(app).post(`${API}/register`).send(validPayload);
    const userId = response.body.data.usuario.id as string;

    const rows = await prisma.$queryRaw<Array<{ coords: string }>>`
      SELECT ST_AsText(coordenadas) AS coords
      FROM producer_profiles
      WHERE user_id = ${userId}::uuid
    `;

    expect(rows[0]?.coords).toBe('POINT(-75.5703 4.6371)');
  });

  it('registra una empresa con su perfil empresarial', async () => {
    const response = await request(app)
      .post(`${API}/register`)
      .send({
        ...validPayload,
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

    expect(response.status).toBe(201);
    expect(response.body.data.usuario.rol).toBe('comprador_b2b');

    const company = await prisma.companyProfile.findUnique({
      where: { userId: response.body.data.usuario.id as string },
    });
    expect(company?.companyName).toBe('Frutas del Quindío S.A.S.');
  });

  it('responde 409 cuando el correo ya está registrado', async () => {
    await request(app).post(`${API}/register`).send(validPayload);

    const response = await request(app)
      .post(`${API}/register`)
      .send({ ...validPayload, documento: '999888777', celular: '3105557799' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    expect(response.body.error.message).toBe('El correo ya se encuentra registrado');

    const count = await prisma.user.count();
    expect(count).toBe(1);
  });

  it('responde 422 con la lista de campos por corregir', async () => {
    const response = await request(app).post(`${API}/register`).send({});

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.length).toBeGreaterThanOrEqual(5);
  });

  it('rechaza contraseñas de menos de 8 caracteres con 422', async () => {
    const response = await request(app)
      .post(`${API}/register`)
      .send({ ...validPayload, password: 'Corta1' });

    expect(response.status).toBe(422);
    expect(response.body.error.details.join(' ')).toContain('8 caracteres');
  });

  it('rechaza el registro sin autorización de datos con 422', async () => {
    const response = await request(app)
      .post(`${API}/register`)
      .send({ ...validPayload, aceptaTratamientoDatos: false });

    expect(response.status).toBe(422);
    expect(response.body.error.details.join(' ')).toContain('Ley 1581');
  });

  it('rechaza documentos con letras con 422', async () => {
    const response = await request(app)
      .post(`${API}/register`)
      .send({ ...validPayload, documento: '10987A5432' });

    expect(response.status).toBe(422);
    expect(response.body.error.details.join(' ')).toContain('dígitos');
  });

  it('rechaza roles inexistentes con 422', async () => {
    const response = await request(app)
      .post(`${API}/register`)
      .send({ ...validPayload, rol: 'vendedor' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('exige los datos de la finca al productor', async () => {
    const response = await request(app)
      .post(`${API}/register`)
      .send({ ...validPayload, finca: undefined });

    expect(response.status).toBe(422);
    expect(response.body.error.message).toContain('finca');
  });
});

describe(`POST ${API}/login`, () => {
  beforeEach(async () => {
    await request(app).post(`${API}/register`).send(validPayload);
  });

  it('autentica con credenciales válidas y responde 200 con tokens', async () => {
    const response = await request(app)
      .post(`${API}/login`)
      .send({ correo: 'maria.lopez@example.com', password: 'Agro2026*' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Inicio de sesión exitoso');
    expect(response.body.data.tokens.accessToken).toBeTruthy();
    expect(response.body.data.usuario.rol).toBe('productor');
  });

  it('responde 401 con credenciales inválidas sin revelar el correo', async () => {
    const response = await request(app)
      .post(`${API}/login`)
      .send({ correo: 'maria.lopez@example.com', password: 'ClaveMala123' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(response.body.error.message).toBe('Correo o contraseña incorrectos');
  });

  it('responde 401 con correo inexistente y el mismo mensaje genérico', async () => {
    const response = await request(app)
      .post(`${API}/login`)
      .send({ correo: 'nadie@example.com', password: 'Agro2026*' });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Correo o contraseña incorrectos');
  });

  it('responde 422 con correo mal formado', async () => {
    const response = await request(app)
      .post(`${API}/login`)
      .send({ correo: 'sin-arroba', password: 'Agro2026*' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe(`POST ${API}/refresh`, () => {
  it('renueva los tokens y revoca el refresh anterior', async () => {
    const register = await request(app).post(`${API}/register`).send(validPayload);
    const refreshToken = register.body.data.tokens.refreshToken as string;

    const response = await request(app).post(`${API}/refresh`).send({ refreshToken });

    expect(response.status).toBe(200);
    expect(response.body.data.tokens.refreshToken).not.toBe(refreshToken);

    const reuse = await request(app).post(`${API}/refresh`).send({ refreshToken });
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('TOKEN_INVALID');
  });

  it('responde 401 con refresh token inválido', async () => {
    const response = await request(app)
      .post(`${API}/refresh`)
      .send({ refreshToken: 'token-invalido' });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('TOKEN_INVALID');
  });

  it('responde 422 sin refresh token', async () => {
    const response = await request(app).post(`${API}/refresh`).send({});

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe(`POST ${API}/logout`, () => {
  it('revoca el refresh token y responde 204', async () => {
    const register = await request(app).post(`${API}/register`).send(validPayload);
    const refreshToken = register.body.data.tokens.refreshToken as string;

    const response = await request(app).post(`${API}/logout`).send({ refreshToken });
    expect(response.status).toBe(204);

    const reuse = await request(app).post(`${API}/refresh`).send({ refreshToken });
    expect(reuse.status).toBe(401);
  });
});

describe(`POST ${API}/forgot-password`, () => {
  it('responde 202 sin revelar si el correo existe', async () => {
    const response = await request(app)
      .post(`${API}/forgot-password`)
      .send({ correo: 'nadie@example.com' });

    expect(response.status).toBe(202);
    expect(response.body.message).toContain('Si el correo está registrado');
  });
});

describe('Salud, errores y trazabilidad', () => {
  it('expone GET /health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('responde 404 en rutas desconocidas con código NOT_FOUND', async () => {
    const response = await request(app).get('/api/v1/inexistente');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });

  it('propaga el correlation id en encabezado y respuesta de error', async () => {
    const response = await request(app)
      .post(`${API}/login`)
      .set('x-correlation-id', 'prueba-correlacion-123')
      .send({ correo: 'nadie@example.com', password: 'Agro2026*' });

    expect(response.headers['x-correlation-id']).toBe('prueba-correlacion-123');
    expect(response.body.correlationId).toBe('prueba-correlacion-123');
  });
});
