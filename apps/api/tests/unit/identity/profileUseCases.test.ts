import { InMemoryUserRepository } from '../../fakes/InMemoryUserRepository';
import { GetProfileUseCase } from '../../../src/modules/identity/application/use-cases/GetProfileUseCase';
import { UpdateProfileUseCase } from '../../../src/modules/identity/application/use-cases/UpdateProfileUseCase';

function buildSut() {
  const repository = new InMemoryUserRepository();
  return {
    repository,
    getProfile: new GetProfileUseCase(repository),
    updateProfile: new UpdateProfileUseCase(repository),
  };
}

describe('GetProfileUseCase', () => {
  it('devuelve el usuario y su perfil de productor', async () => {
    const sut = buildSut();
    const user = sut.repository.seedUser({ email: 'productor@example.com' });
    sut.repository.producerProfiles.set(user.id, {
      farmName: 'El Mirador',
      municipality: 'Salento',
      village: 'Boquía',
      latitude: 4.6371,
      longitude: -75.5703,
    });

    const profile = await sut.getProfile.execute(user.id);

    expect(profile.user.correo).toBe('productor@example.com');
    expect(profile.producer).toMatchObject({
      farmName: 'El Mirador',
      latitude: 4.6371,
      longitude: -75.5703,
    });
  });

  it('responde NOT_FOUND si el usuario no existe', async () => {
    const sut = buildSut();

    await expect(sut.getProfile.execute('no-existe')).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  });
});

describe('UpdateProfileUseCase', () => {
  it('actualiza el perfil del productor y conserva sus coordenadas', async () => {
    const sut = buildSut();
    const user = sut.repository.seedUser({ email: 'productor-update@example.com' });
    sut.repository.producerProfiles.set(user.id, {
      farmName: 'El Mirador',
      municipality: 'Salento',
      village: 'Boquía',
      latitude: 4.6371,
      longitude: -75.5703,
    });
    const profile = await sut.updateProfile.execute(
      { id: user.id, role: 'productor' },
      { producer: { farmName: 'La Esperanza', municipality: 'Filandia' } },
    );

    expect(profile.producer).toMatchObject({
      farmName: 'La Esperanza',
      municipality: 'Filandia',
      latitude: 4.6371,
      longitude: -75.5703,
    });
  });

  it('rechaza actualizar un bloque que no corresponde al rol', async () => {
    const sut = buildSut();
    const user = sut.repository.seedUser({
      email: 'empresa@example.com',
      roleName: 'comprador_b2b',
    });
    sut.repository.companyProfiles.set(user.id, {
      companyName: 'Frutas del Quindío',
      nit: '901234567-8',
    });

    await expect(
      sut.updateProfile.execute(
        { id: user.id, role: 'comprador_b2b' },
        { producer: { farmName: 'No permitido' } },
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });

  it('rechaza un comando sin bloques o con más de uno', async () => {
    const sut = buildSut();
    const user = sut.repository.seedUser({ email: 'bloques@example.com' });
    sut.repository.producerProfiles.set(user.id, {
      farmName: 'El Mirador',
      municipality: 'Salento',
      village: 'Boquía',
    });

    await expect(
      sut.updateProfile.execute({ id: user.id, role: 'productor' }, {}),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });

    await expect(
      sut.updateProfile.execute(
        { id: user.id, role: 'productor' },
        {
          producer: { farmName: 'El Mirador' },
          company: { companyName: 'No permitida' },
        },
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('responde NOT_FOUND cuando el usuario no existe', async () => {
    const sut = buildSut();

    await expect(
      sut.updateProfile.execute(
        { id: 'no-existe', role: 'productor' },
        { producer: { farmName: 'Finca' } },
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });
  });

  it('responde NOT_FOUND si el rol no tiene el perfil esperado', async () => {
    const sut = buildSut();
    const productor = sut.repository.seedUser({ email: 'sin-finca@example.com' });
    const empresa = sut.repository.seedUser({
      email: 'sin-empresa@example.com',
      roleName: 'comprador_b2b',
    });
    const transportista = sut.repository.seedUser({
      email: 'sin-vehiculo@example.com',
      roleName: 'transportista',
    });

    await expect(
      sut.updateProfile.execute(
        { id: productor.id, role: 'productor' },
        { producer: { farmName: 'Finca' } },
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      sut.updateProfile.execute(
        { id: empresa.id, role: 'comprador_b2b' },
        { company: { companyName: 'Empresa' } },
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      sut.updateProfile.execute(
        { id: transportista.id, role: 'transportista' },
        { transporter: { capacityKg: 1000 } },
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  it('rechaza roles sin perfil editable y bloques ajenos al rol', async () => {
    const sut = buildSut();
    const admin = sut.repository.seedUser({
      email: 'admin@example.com',
      roleName: 'administrador',
    });

    await expect(
      sut.updateProfile.execute(
        { id: admin.id, role: 'administrador' },
        { producer: { farmName: 'No permitida' } },
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });

    const productor = sut.repository.seedUser({ email: 'productor-ajeno@example.com' });
    sut.repository.producerProfiles.set(productor.id, {
      farmName: 'El Mirador',
      municipality: 'Salento',
      village: 'Boquía',
    });

    await expect(
      sut.updateProfile.execute(
        { id: productor.id, role: 'productor' },
        { company: { companyName: 'No permitida' } },
      ),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });

  it('actualiza la empresa sin permitir cambiar el NIT', async () => {
    const sut = buildSut();
    const user = sut.repository.seedUser({
      email: 'empresa2@example.com',
      roleName: 'comprador_b2b',
    });
    sut.repository.companyProfiles.set(user.id, {
      companyName: 'Frutas del Quindío',
      nit: '901234567-8',
    });

    const profile = await sut.updateProfile.execute(
      { id: user.id, role: 'comprador_b2b' },
      { company: { companyName: 'Frutas del Quindío S.A.S.', municipality: 'Armenia' } },
    );

    expect(profile.company).toMatchObject({
      companyName: 'Frutas del Quindío S.A.S.',
      nit: '901234567-8',
      municipality: 'Armenia',
    });
  });

  it('permite corregir datos aunque el SOAT anterior esté vencido', async () => {
    const sut = buildSut();
    const user = sut.repository.seedUser({
      email: 'transporte-vencido@example.com',
      roleName: 'transportista',
    });
    sut.repository.transporterProfiles.set(user.id, {
      vehicleType: 'camion',
      plate: 'ABC123',
      capacityKg: 3500,
      coverageMunicipalities: ['Armenia'],
      coldChain: true,
      soatExpiresAt: new Date('2020-01-01T23:59:59.999Z'),
      licenseExpiresAt: new Date('2020-01-01T23:59:59.999Z'),
    });

    const profile = await sut.updateProfile.execute(
      { id: user.id, role: 'transportista' },
      { transporter: { capacityKg: 5000 } },
    );

    expect(profile.transporter?.capacityKg).toBe(5000);
  });

  it('rechaza una fecha de SOAT nueva que ya esté vencida', async () => {
    const sut = buildSut();
    const user = sut.repository.seedUser({
      email: 'transporte-fecha-vencida@example.com',
      roleName: 'transportista',
    });
    sut.repository.transporterProfiles.set(user.id, {
      vehicleType: 'camion',
      plate: 'ABC123',
      capacityKg: 3500,
      coverageMunicipalities: ['Armenia'],
      coldChain: true,
      soatExpiresAt: new Date('2020-01-01T23:59:59.999Z'),
      licenseExpiresAt: new Date('2020-01-01T23:59:59.999Z'),
    });

    await expect(
      sut.updateProfile.execute(
        { id: user.id, role: 'transportista' },
        { transporter: { soatExpiresAt: '2020-01-01' } },
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('rechaza fechas, capacidad y cobertura inválidas del transportista', async () => {
    const sut = buildSut();
    const user = sut.repository.seedUser({
      email: 'transporte-invalido@example.com',
      roleName: 'transportista',
    });
    sut.repository.transporterProfiles.set(user.id, {
      vehicleType: 'camion',
      plate: 'ABC123',
      capacityKg: 3500,
      coverageMunicipalities: ['Armenia'],
      coldChain: true,
      soatExpiresAt: new Date('2028-12-31T23:59:59.999Z'),
      licenseExpiresAt: new Date('2028-12-31T23:59:59.999Z'),
    });

    await expect(
      sut.updateProfile.execute(
        { id: user.id, role: 'transportista' },
        { transporter: { soatExpiresAt: '2028-02-30' } },
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    await expect(
      sut.updateProfile.execute(
        { id: user.id, role: 'transportista' },
        { transporter: { capacityKg: 0 } },
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    await expect(
      sut.updateProfile.execute(
        { id: user.id, role: 'transportista' },
        { transporter: { coverageMunicipalities: [] } },
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });

  it('actualiza transportista y normaliza la placa', async () => {
    const sut = buildSut();
    const user = sut.repository.seedUser({
      email: 'transporte@example.com',
      roleName: 'transportista',
    });
    sut.repository.transporterProfiles.set(user.id, {
      vehicleType: 'camion',
      plate: 'ABC123',
      capacityKg: 3500,
      coverageMunicipalities: ['Armenia'],
      coldChain: true,
      soatExpiresAt: new Date('2027-12-31T23:59:59.999Z'),
      licenseExpiresAt: new Date('2027-12-31T23:59:59.999Z'),
    });

    const profile = await sut.updateProfile.execute(
      { id: user.id, role: 'transportista' },
      {
        transporter: {
          plate: 'xyz987',
          capacityKg: 5000,
          coverageMunicipalities: ['Armenia', 'Salento'],
        },
      },
    );

    expect(profile.transporter).toMatchObject({
      plate: 'XYZ987',
      capacityKg: 5000,
      coverageMunicipalities: ['Armenia', 'Salento'],
    });
  });
});
