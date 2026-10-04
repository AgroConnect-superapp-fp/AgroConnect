import { randomUUID } from 'node:crypto';
import { User } from '../../../src/modules/auth/domain/entities/User';
import { Role } from '../../../src/modules/auth/domain/entities/Role';
import { ProducerProfile } from '../../../src/modules/auth/domain/entities/ProducerProfile';
import { CompanyProfile } from '../../../src/modules/auth/domain/entities/CompanyProfile';
import { RefreshToken } from '../../../src/modules/auth/domain/entities/RefreshToken';
import { DomainError } from '../../../src/shared/domain/errors';

function buildUser(overrides: Partial<Parameters<typeof User.create>[0]> = {}): User {
  return User.create({
    id: randomUUID(),
    fullName: 'María Fernanda López',
    document: '1098765432',
    email: 'maria@example.com',
    phone: '3105557788',
    passwordHash: 'hash',
    roleId: randomUUID(),
    roleName: 'productor',
    status: 'ACTIVO',
    acceptsDataProcessing: true,
    createdAt: new Date(),
    ...overrides,
  });
}

describe('User', () => {
  it('expone los datos públicos sin información sensible', () => {
    const user = buildUser();
    const publicProfile = user.toPublicProfile();

    expect(publicProfile).toEqual({
      id: user.id,
      nombre: 'María Fernanda López',
      correo: 'maria@example.com',
      rol: 'productor',
      estado: 'ACTIVO',
      verificado: false,
      fechaRegistro: expect.any(String),
    });
    expect(JSON.stringify(publicProfile)).not.toContain('hash');
  });

  it('rechaza nombres demasiado cortos', () => {
    expect(() => buildUser({ fullName: 'Ab' })).toThrow(DomainError);
  });

  it('rechaza usuarios sin autorización de tratamiento de datos', () => {
    expect(() => buildUser({ acceptsDataProcessing: false })).toThrow('Ley 1581');
  });

  it('reconoce usuarios activos', () => {
    expect(buildUser().isActive()).toBe(true);
    expect(buildUser({ status: 'SUSPENDIDO' }).isActive()).toBe(false);
  });

  it('expone los atributos completos del usuario', () => {
    const user = buildUser();

    expect(user.document).toBe('1098765432');
    expect(user.phone).toBe('3105557788');
    expect(user.roleId).toBeTruthy();
    expect(user.roleName).toBe('productor');
    expect(user.status).toBe('ACTIVO');
    expect(user.acceptsDataProcessing).toBe(true);
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.passwordHash).toBe('hash');
    expect(user.id).toBeTruthy();
    expect(user.email).toBe('maria@example.com');
  });
});

describe('Role', () => {
  it('acepta los cinco roles del sistema', () => {
    const names = [
      'productor',
      'comprador_b2c',
      'comprador_b2b',
      'transportista',
      'administrador',
    ] as const;

    for (const name of names) {
      const role = Role.create({ id: randomUUID(), name, description: name });
      expect(role.name).toBe(name);
    }
  });

  it('rechaza roles desconocidos', () => {
    expect(() =>
      Role.create({ id: randomUUID(), name: 'vendedor' as never, description: 'x' }),
    ).toThrow('no es válido');
  });

  it('identifica los roles que requieren perfil de finca o empresa', () => {
    const producer = Role.create({ id: randomUUID(), name: 'productor', description: 'x' });
    const company = Role.create({ id: randomUUID(), name: 'comprador_b2b', description: 'x' });
    const buyer = Role.create({ id: randomUUID(), name: 'comprador_b2c', description: 'x' });

    expect(producer.requiresProducerProfile()).toBe(true);
    expect(producer.requiresCompanyProfile()).toBe(false);
    expect(company.requiresCompanyProfile()).toBe(true);
    expect(buyer.requiresProducerProfile()).toBe(false);
    expect(buyer.requiresCompanyProfile()).toBe(false);
  });

  it('valida nombres de rol con el type guard', () => {
    expect(Role.isValidName('productor')).toBe(true);
    expect(Role.isValidName('inventado')).toBe(false);
  });
});

describe('ProducerProfile', () => {
  it('acepta datos completos de la finca con coordenadas', () => {
    const profile = ProducerProfile.create({
      id: randomUUID(),
      userId: randomUUID(),
      farmName: 'El Mirador',
      municipality: 'Salento',
      village: 'Boquía',
      latitude: 4.6371,
      longitude: -75.5703,
    });

    expect(profile.farmName).toBe('El Mirador');
    expect(profile.latitude).toBe(4.6371);
  });

  it('rechaza coordenadas fuera de rango', () => {
    expect(() =>
      ProducerProfile.create({
        id: randomUUID(),
        userId: randomUUID(),
        farmName: 'El Mirador',
        municipality: 'Salento',
        village: 'Boquía',
        latitude: 99,
        longitude: -75.5703,
      }),
    ).toThrow('coordenadas');
  });

  it('rechaza fincas sin municipio suficiente', () => {
    expect(() =>
      ProducerProfile.create({
        id: randomUUID(),
        userId: randomUUID(),
        farmName: 'El Mirador',
        municipality: 'Sa',
        village: 'Boquía',
      }),
    ).toThrow(DomainError);
  });

  it('rechaza veredas demasiado cortas y nombres de finca cortos', () => {
    expect(() =>
      ProducerProfile.create({
        id: randomUUID(),
        userId: randomUUID(),
        farmName: 'El Mirador',
        municipality: 'Salento',
        village: 'B',
      }),
    ).toThrow('vereda');

    expect(() =>
      ProducerProfile.create({
        id: randomUUID(),
        userId: randomUUID(),
        farmName: 'El',
        municipality: 'Salento',
        village: 'Boquía',
      }),
    ).toThrow('finca');
  });

  it('rechaza coordenadas incompletas de la finca', () => {
    expect(() =>
      ProducerProfile.create({
        id: randomUUID(),
        userId: randomUUID(),
        farmName: 'El Mirador',
        municipality: 'Salento',
        village: 'Boquía',
        latitude: 4.6371,
      }),
    ).toThrow('coordenadas');
  });

  it('expone los atributos completos del perfil de finca', () => {
    const profile = ProducerProfile.create({
      id: 'perfil-1',
      userId: 'usuario-1',
      farmName: 'El Mirador',
      municipality: 'Salento',
      village: 'Boquía',
      latitude: 4.6371,
      longitude: -75.5703,
    });

    expect(profile.id).toBe('perfil-1');
    expect(profile.userId).toBe('usuario-1');
    expect(profile.municipality).toBe('Salento');
    expect(profile.village).toBe('Boquía');
    expect(profile.longitude).toBe(-75.5703);
  });
});

describe('CompanyProfile', () => {
  it('acepta una empresa con NIT válido', () => {
    const profile = CompanyProfile.create({
      id: randomUUID(),
      userId: randomUUID(),
      companyName: 'Frutas del Quindío S.A.S.',
      nit: '901234567-8',
    });

    expect(profile.nit).toBe('901234567-8');
  });

  it('rechaza NIT con formato inválido', () => {
    expect(() =>
      CompanyProfile.create({
        id: randomUUID(),
        userId: randomUUID(),
        companyName: 'Frutas del Quindío S.A.S.',
        nit: 'ABC123',
      }),
    ).toThrow('NIT');
  });

  it('rechaza razones sociales demasiado cortas', () => {
    expect(() =>
      CompanyProfile.create({
        id: randomUUID(),
        userId: randomUUID(),
        companyName: 'AB',
        nit: '901234567-8',
      }),
    ).toThrow('razón social');
  });

  it('expone los atributos completos del perfil empresarial', () => {
    const profile = CompanyProfile.create({
      id: 'empresa-1',
      userId: 'usuario-2',
      companyName: 'Frutas del Quindío S.A.S.',
      nit: '901234567-8',
      address: 'Calle 12 # 4-56',
    });

    expect(profile.id).toBe('empresa-1');
    expect(profile.userId).toBe('usuario-2');
    expect(profile.nit).toBe('901234567-8');
    expect(profile.address).toBe('Calle 12 # 4-56');
  });
});

describe('RefreshToken', () => {
  const base = {
    id: randomUUID(),
    userId: randomUUID(),
    tokenHash: 'hash',
    expiresAt: new Date(Date.now() + 60_000),
    revoked: false,
    createdAt: new Date(),
  };

  it('está vigente cuando no está revocado ni expirado', () => {
    expect(RefreshToken.create(base).isUsable()).toBe(true);
  });

  it('no está vigente cuando está revocado', () => {
    expect(RefreshToken.create({ ...base, revoked: true }).isUsable()).toBe(false);
  });

  it('no está vigente cuando expiró', () => {
    const expired = RefreshToken.create({ ...base, expiresAt: new Date(Date.now() - 1_000) });
    expect(expired.isExpired()).toBe(true);
    expect(expired.isUsable()).toBe(false);
  });
});
