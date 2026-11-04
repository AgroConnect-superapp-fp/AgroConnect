import type { Server } from 'node:http';
import { randomUUID } from 'node:crypto';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { PrismaService } from '../../src/prisma/prisma.service';
import { JwtTokenService } from '../../src/modules/identity/infrastructure/services/JwtTokenService';
import { env } from '../../src/shared/config/env';

describe('Profile (e2e)', () => {
  let app: NestExpressApplication;
  let server: Server;
  let prisma: PrismaService;

  const producerId = randomUUID();
  const buyerId = randomUUID();
  const companyId = randomUUID();
  const transporterId = randomUUID();
  const suffix = `${Date.now()}`.slice(-8);
  const tokenService = new JwtTokenService(
    env.JWT_ACCESS_SECRET,
    env.JWT_REFRESH_SECRET,
    env.JWT_ACCESS_EXPIRES_IN,
    env.JWT_REFRESH_EXPIRES_IN,
    env.JWT_ISSUER,
    env.JWT_AUDIENCE,
  );
  let producerToken = '';
  let buyerToken = '';
  let companyToken = '';
  let transporterToken = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    configureApp(app);
    app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
    await app.init();
    server = app.getHttpServer() as Server;
    prisma = app.get(PrismaService);

    const producerRole = await prisma.role.findUniqueOrThrow({ where: { name: 'productor' } });
    const buyerRole = await prisma.role.findUniqueOrThrow({ where: { name: 'comprador_b2c' } });
    const companyRole = await prisma.role.findUniqueOrThrow({ where: { name: 'comprador_b2b' } });
    const transporterRole = await prisma.role.findUniqueOrThrow({
      where: { name: 'transportista' },
    });

    await prisma.user.createMany({
      data: [
        {
          id: producerId,
          fullName: 'Productor Perfil E2E',
          document: `PP${suffix}`,
          email: `profile.producer.${suffix}@example.com`,
          phone: `32${suffix.padStart(8, '0')}`,
          passwordHash: 'hash',
          roleId: producerRole.id,
          status: 'ACTIVO',
          acceptsDataProcessing: true,
          emailVerifiedAt: new Date(),
        },
        {
          id: buyerId,
          fullName: 'Comprador Perfil E2E',
          document: `PC${suffix}`,
          email: `profile.buyer.${suffix}@example.com`,
          phone: `33${suffix.padStart(8, '0')}`,
          passwordHash: 'hash',
          roleId: buyerRole.id,
          status: 'ACTIVO',
          acceptsDataProcessing: true,
          emailVerifiedAt: new Date(),
        },
        {
          id: companyId,
          fullName: 'Empresa Perfil E2E',
          document: `PE${suffix}`,
          email: `profile.company.${suffix}@example.com`,
          phone: `34${suffix.padStart(8, '0')}`,
          passwordHash: 'hash',
          roleId: companyRole.id,
          status: 'ACTIVO',
          acceptsDataProcessing: true,
          emailVerifiedAt: new Date(),
        },
        {
          id: transporterId,
          fullName: 'Transportista Perfil E2E',
          document: `PT${suffix}`,
          email: `profile.transporter.${suffix}@example.com`,
          phone: `35${suffix.padStart(8, '0')}`,
          passwordHash: 'hash',
          roleId: transporterRole.id,
          status: 'ACTIVO',
          acceptsDataProcessing: true,
          emailVerifiedAt: new Date(),
        },
      ],
    });

    const profile = await prisma.producerProfile.create({
      data: {
        userId: producerId,
        farmName: 'Finca Perfil',
        municipality: 'Salento',
        village: 'Boquía',
      },
    });
    await prisma.$executeRaw`
      UPDATE producer_profiles
      SET coordenadas = ST_SetSRID(ST_MakePoint(-75.5703, 4.6371), 4326)::geography
      WHERE id = ${profile.id}::uuid
    `;

    await prisma.companyProfile.create({
      data: {
        userId: companyId,
        companyName: 'Frutas Perfil E2E',
        nit: `9${suffix}0-1`,
        address: 'Calle 1 # 2-3',
        companyType: 'distribuidor',
        department: 'Quindío',
        municipality: 'Armenia',
      },
    });
    await prisma.transporterProfile.create({
      data: {
        userId: transporterId,
        vehicleType: 'camion',
        plate: `ABC${suffix.slice(-3)}`,
        capacityKg: 3500,
        coverageMunicipalities: ['Armenia'],
        coldChain: true,
        soatExpiresAt: new Date('2028-12-31T00:00:00.000Z'),
        licenseExpiresAt: new Date('2028-12-31T00:00:00.000Z'),
      },
    });

    producerToken = tokenService.generateTokens({
      userId: producerId,
      role: 'productor',
    }).accessToken;
    buyerToken = tokenService.generateTokens({
      userId: buyerId,
      role: 'comprador_b2c',
    }).accessToken;
    companyToken = tokenService.generateTokens({
      userId: companyId,
      role: 'comprador_b2b',
    }).accessToken;
    transporterToken = tokenService.generateTokens({
      userId: transporterId,
      role: 'transportista',
    }).accessToken;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { id: { in: [producerId, buyerId, companyId, transporterId] } },
    });
    await app.close();
  });

  it('rechaza sin cookie de sesión con 401', async () => {
    const response = await request(server).get('/api/v1/profile/me');

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'TOKEN_INVALID' },
    });
  });

  it('devuelve el perfil del productor autenticado', async () => {
    const response = await request(server)
      .get('/api/v1/profile/me')
      .set('Cookie', `access_token=${producerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Perfil obtenido correctamente',
      data: {
        usuario: {
          id: producerId,
          correo: `profile.producer.${suffix}@example.com`,
          rol: 'productor',
          verificado: true,
        },
        productor: {
          nombre: 'Finca Perfil',
          municipio: 'Salento',
          vereda: 'Boquía',
          latitud: 4.6371,
          longitud: -75.5703,
        },
      },
    });
  });

  it('actualiza únicamente el perfil del rol autenticado', async () => {
    const response = await request(server)
      .patch('/api/v1/profile/me')
      .set('Cookie', `access_token=${producerToken}`)
      .send({ productor: { nombre: 'Finca Perfil Actualizada', municipio: 'Filandia' } });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      message: 'Perfil actualizado correctamente',
      data: {
        productor: {
          nombre: 'Finca Perfil Actualizada',
          municipio: 'Filandia',
          vereda: 'Boquía',
          latitud: 4.6371,
          longitud: -75.5703,
        },
      },
    });
  });

  it('rechaza un bloque que no corresponde al rol con 403', async () => {
    const response = await request(server)
      .patch('/api/v1/profile/me')
      .set('Cookie', `access_token=${producerToken}`)
      .send({ empresa: { razonSocial: 'No permitida' } });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN' },
    });
  });

  it('rechaza coordenadas incompletas con 422', async () => {
    const response = await request(server)
      .patch('/api/v1/profile/me')
      .set('Cookie', `access_token=${producerToken}`)
      .send({ productor: { latitud: 4.5 } });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });

  it('actualiza las coordenadas del productor', async () => {
    const response = await request(server)
      .patch('/api/v1/profile/me')
      .set('Cookie', `access_token=${producerToken}`)
      .send({ productor: { latitud: 4.7, longitud: -75.6 } });

    expect(response.status).toBe(200);
    expect(response.body.data.productor).toMatchObject({ latitud: 4.7, longitud: -75.6 });
  });

  it('consulta y actualiza el perfil de empresa', async () => {
    const getResponse = await request(server)
      .get('/api/v1/profile/me')
      .set('Cookie', `access_token=${companyToken}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.empresa).toMatchObject({
      razonSocial: 'Frutas Perfil E2E',
      tipoEmpresa: 'distribuidor',
      municipio: 'Armenia',
    });

    const patchResponse = await request(server)
      .patch('/api/v1/profile/me')
      .set('Cookie', `access_token=${companyToken}`)
      .send({ empresa: { razonSocial: 'Frutas Perfil Actualizada', direccion: '' } });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.data.empresa).toMatchObject({
      razonSocial: 'Frutas Perfil Actualizada',
      nit: `9${suffix}0-1`,
    });
  });

  it('consulta y actualiza el perfil de transportista', async () => {
    const getResponse = await request(server)
      .get('/api/v1/profile/me')
      .set('Cookie', `access_token=${transporterToken}`);
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.data.transportista).toMatchObject({
      tipoVehiculo: 'camion',
      placa: `ABC${suffix.slice(-3)}`,
      capacidadKg: 3500,
      cobertura: ['Armenia'],
      cadenaFrio: true,
    });

    const patchResponse = await request(server)
      .patch('/api/v1/profile/me')
      .set('Cookie', `access_token=${transporterToken}`)
      .send({
        transportista: {
          capacidadKg: 5000,
          cobertura: ['Armenia', 'Salento'],
          cadenaFrio: false,
        },
      });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.data.transportista).toMatchObject({
      capacidadKg: 5000,
      cobertura: ['Armenia', 'Salento'],
      cadenaFrio: false,
    });
  });

  it('un comprador B2C no puede editar un perfil empresarial', async () => {
    const response = await request(server)
      .patch('/api/v1/profile/me')
      .set('Cookie', `access_token=${buyerToken}`)
      .send({ empresa: { razonSocial: 'Empresa sin perfil' } });

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'FORBIDDEN' },
    });
  });
});
