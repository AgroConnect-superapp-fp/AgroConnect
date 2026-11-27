import { InMemoryUserRepository } from '../../fakes/InMemoryUserRepository';
import { ListAdminUsersUseCase } from '../../../src/modules/identity/application/use-cases/ListAdminUsersUseCase';
import { GetAdminUserUseCase } from '../../../src/modules/identity/application/use-cases/GetAdminUserUseCase';
import { UpdateUserStatusUseCase } from '../../../src/modules/identity/application/use-cases/UpdateUserStatusUseCase';
import { UpdateUserRoleUseCase } from '../../../src/modules/identity/application/use-cases/UpdateUserRoleUseCase';

const adminActor = { id: 'admin-actor', role: 'administrador' };
const producerActor = { id: 'producer-actor', role: 'productor' };

function buildSut() {
  const repository = new InMemoryUserRepository();

  return {
    repository,
    list: new ListAdminUsersUseCase(repository),
    get: new GetAdminUserUseCase(repository),
    updateStatus: new UpdateUserStatusUseCase(repository),
    updateRole: new UpdateUserRoleUseCase(repository),
  };
}

function seedUsers(repository: InMemoryUserRepository): void {
  repository.seedUser({
    id: 'user-producer',
    fullName: 'María Cafetera',
    email: 'maria@example.com',
    document: '100100',
    phone: '3001111111',
    roleName: 'productor',
  });
  repository.seedUser({
    id: 'user-buyer',
    fullName: 'Carlos Comprador',
    email: 'carlos@example.com',
    document: '200200',
    phone: '3002222222',
    roleName: 'comprador_b2c',
    status: 'INACTIVO',
  });
  repository.seedUser({
    id: 'user-admin',
    fullName: 'Ana Administradora',
    email: 'ana@example.com',
    document: '300300',
    phone: '3003333333',
    roleName: 'administrador',
  });
}

describe('ListAdminUsersUseCase', () => {
  it('lista todos los usuarios para un administrador sin exponer secretos', async () => {
    const sut = buildSut();
    seedUsers(sut.repository);

    const page = await sut.list.execute(adminActor, { limit: 20, offset: 0 });

    expect(page.total).toBe(3);
    expect(page.items).toHaveLength(3);
    expect(page.limit).toBe(20);
    expect(page.offset).toBe(0);
    expect(page.items[0]).not.toHaveProperty('passwordHash');
    expect(page.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'user-producer', nombre: 'María Cafetera' }),
      ]),
    );
  });

  it('busca sin distinguir mayúsculas por nombre, correo, documento y celular', async () => {
    const sut = buildSut();
    seedUsers(sut.repository);

    const byName = await sut.list.execute(adminActor, {
      search: 'MARÍA',
      limit: 20,
      offset: 0,
    });
    expect(byName.items.map((item) => item.id)).toEqual(['user-producer']);

    const byEmail = await sut.list.execute(adminActor, {
      search: 'CARLOS@EXAMPLE',
      limit: 20,
      offset: 0,
    });
    expect(byEmail.items.map((item) => item.id)).toEqual(['user-buyer']);

    const byDocument = await sut.list.execute(adminActor, {
      search: '300300',
      limit: 20,
      offset: 0,
    });
    expect(byDocument.items.map((item) => item.id)).toEqual(['user-admin']);

    const byPhone = await sut.list.execute(adminActor, {
      search: '3002222222',
      limit: 20,
      offset: 0,
    });
    expect(byPhone.items.map((item) => item.id)).toEqual(['user-buyer']);
  });

  it('filtra por rol y estado y pagina los resultados', async () => {
    const sut = buildSut();
    seedUsers(sut.repository);

    const admins = await sut.list.execute(adminActor, {
      rol: 'administrador',
      limit: 20,
      offset: 0,
    });
    expect(admins.items.map((item) => item.id)).toEqual(['user-admin']);

    const inactive = await sut.list.execute(adminActor, {
      estado: 'INACTIVO',
      limit: 20,
      offset: 0,
    });
    expect(inactive.items.map((item) => item.id)).toEqual(['user-buyer']);

    const firstPage = await sut.list.execute(adminActor, {
      search: 'example.com',
      limit: 1,
      offset: 0,
    });
    const secondPage = await sut.list.execute(adminActor, {
      search: 'example.com',
      limit: 1,
      offset: 1,
    });

    expect(firstPage.total).toBe(3);
    expect(firstPage.items).toHaveLength(1);
    expect(secondPage.items).toHaveLength(1);
    expect(secondPage.items[0]?.id).not.toBe(firstPage.items[0]?.id);
  });

  it('rechaza a un actor que no es administrador', async () => {
    const sut = buildSut();

    await expect(sut.list.execute(producerActor, { limit: 20, offset: 0 })).rejects.toMatchObject({
      code: 'FORBIDDEN',
      statusCode: 403,
    });
  });

  it('rechaza límites, búsquedas y filtros inválidos', async () => {
    const sut = buildSut();

    await expect(sut.list.execute(adminActor, { limit: 0, offset: 0 })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });

    await expect(sut.list.execute(adminActor, { limit: 20, offset: -1 })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });

    await expect(
      sut.list.execute(adminActor, { search: 'a', limit: 20, offset: 0 }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });

    await expect(
      sut.list.execute(adminActor, { rol: 'superadmin', limit: 20, offset: 0 }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR', statusCode: 422 });
  });
});

describe('GetAdminUserUseCase', () => {
  it('devuelve el detalle administrativo de un usuario existente', async () => {
    const sut = buildSut();
    seedUsers(sut.repository);

    const user = await sut.get.execute(adminActor, 'user-producer');

    expect(user).toMatchObject({
      id: 'user-producer',
      nombre: 'María Cafetera',
      documento: '100100',
      celular: '3001111111',
      rol: 'productor',
      estado: 'ACTIVO',
    });
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('responde 404 cuando el usuario no existe y 403 para no administradores', async () => {
    const sut = buildSut();

    await expect(
      sut.get.execute(adminActor, '00000000-0000-4000-8000-000000000000'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });

    await expect(sut.get.execute(producerActor, 'user-producer')).rejects.toMatchObject({
      code: 'FORBIDDEN',
      statusCode: 403,
    });
  });
});

describe('UpdateUserStatusUseCase', () => {
  it('cambia el estado y revoca todos los refresh tokens del usuario', async () => {
    const sut = buildSut();
    seedUsers(sut.repository);
    sut.repository.seedRefreshToken(
      'user-producer',
      'refresh-producer',
      new Date(Date.now() + 3_600_000),
    );

    const user = await sut.updateStatus.execute(adminActor, 'user-producer', 'SUSPENDIDO');

    expect(user.estado).toBe('SUSPENDIDO');
    expect(sut.repository.users.find((item) => item.id === 'user-producer')?.status).toBe(
      'SUSPENDIDO',
    );
    expect(sut.repository.refreshTokens).toHaveLength(1);
    expect(sut.repository.refreshTokens.every((token) => token.revoked)).toBe(true);
  });

  it('no permite que un administrador cambie su propio estado', async () => {
    const sut = buildSut();
    sut.repository.seedUser({
      id: adminActor.id,
      fullName: 'Administradora',
      email: 'admin@example.com',
      document: '900100',
      phone: '3009999999',
      roleName: 'administrador',
    });

    await expect(
      sut.updateStatus.execute(adminActor, adminActor.id, 'INACTIVO'),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      statusCode: 409,
      message: expect.stringContaining('propio'),
    });
  });

  it('protege al último administrador activo', async () => {
    const sut = buildSut();
    sut.repository.seedUser({
      id: 'last-admin',
      fullName: 'Última Administradora',
      email: 'last-admin@example.com',
      document: '900200',
      phone: '3008888888',
      roleName: 'administrador',
    });

    await expect(
      sut.updateStatus.execute(
        { id: 'another-admin', role: 'administrador' },
        'last-admin',
        'INACTIVO',
      ),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      statusCode: 409,
      message: expect.stringContaining('último administrador activo'),
    });
  });

  it('responde 404 si el usuario no existe y 403 a un no administrador', async () => {
    const sut = buildSut();

    await expect(
      sut.updateStatus.execute(adminActor, '00000000-0000-4000-8000-000000000000', 'INACTIVO'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });

    await expect(
      sut.updateStatus.execute(producerActor, 'user-producer', 'INACTIVO'),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });
});

describe('UpdateUserRoleUseCase', () => {
  it('cambia el rol y revoca todos los refresh tokens del usuario', async () => {
    const sut = buildSut();
    seedUsers(sut.repository);
    sut.repository.seedRefreshToken(
      'user-buyer',
      'refresh-buyer',
      new Date(Date.now() + 3_600_000),
    );

    sut.repository.producerProfiles.set('user-buyer', {
      farmName: 'Finca del Comprador',
      municipality: 'Armenia',
      village: 'El Progreso',
    });

    const user = await sut.updateRole.execute(adminActor, 'user-buyer', 'productor');

    expect(user.rol).toBe('productor');
    expect(sut.repository.users.find((item) => item.id === 'user-buyer')?.roleName).toBe(
      'productor',
    );
    expect(sut.repository.refreshTokens.every((token) => token.revoked)).toBe(true);
  });

  it('rechaza asignar un rol que exige perfil si el usuario no lo tiene', async () => {
    const sut = buildSut();
    seedUsers(sut.repository);

    await expect(
      sut.updateRole.execute(adminActor, 'user-buyer', 'productor'),
    ).rejects.toMatchObject({ code: 'CONFLICT', statusCode: 409 });
  });

  it('rechaza un rol inexistente con ROLE_NOT_FOUND', async () => {
    const sut = buildSut();
    seedUsers(sut.repository);

    await expect(
      sut.updateRole.execute(adminActor, 'user-buyer', 'superadmin'),
    ).rejects.toMatchObject({ code: 'ROLE_NOT_FOUND', statusCode: 422 });
  });

  it('no permite que un administrador cambie su propio rol', async () => {
    const sut = buildSut();
    sut.repository.seedUser({
      id: adminActor.id,
      fullName: 'Administradora',
      email: 'admin@example.com',
      document: '900300',
      phone: '3007777777',
      roleName: 'administrador',
    });

    await expect(
      sut.updateRole.execute(adminActor, adminActor.id, 'productor'),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      statusCode: 409,
      message: expect.stringContaining('propio'),
    });
  });

  it('no permite quitar el rol al último administrador activo', async () => {
    const sut = buildSut();
    sut.repository.seedUser({
      id: 'last-admin',
      fullName: 'Última Administradora',
      email: 'last-admin@example.com',
      document: '900400',
      phone: '3006666666',
      roleName: 'administrador',
    });
    sut.repository.producerProfiles.set('last-admin', {
      farmName: 'Finca de Respaldo',
      municipality: 'Armenia',
      village: 'El Progreso',
    });

    await expect(
      sut.updateRole.execute(
        { id: 'another-admin', role: 'administrador' },
        'last-admin',
        'productor',
      ),
    ).rejects.toMatchObject({
      code: 'CONFLICT',
      statusCode: 409,
      message: expect.stringContaining('último administrador activo'),
    });
  });

  it('responde 404 si el usuario no existe y 403 a un no administrador', async () => {
    const sut = buildSut();

    await expect(
      sut.updateRole.execute(adminActor, '00000000-0000-4000-8000-000000000000', 'productor'),
    ).rejects.toMatchObject({ code: 'NOT_FOUND', statusCode: 404 });

    await expect(
      sut.updateRole.execute(producerActor, 'user-producer', 'productor'),
    ).rejects.toMatchObject({ code: 'FORBIDDEN', statusCode: 403 });
  });
});
