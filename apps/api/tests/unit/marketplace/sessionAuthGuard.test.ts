import type { ExecutionContext } from '@nestjs/common';
import { SessionAuthGuard } from '../../../src/modules/identity/presentation/guards/SessionAuthGuard';
import { User } from '../../../src/modules/identity/domain/entities/User';
import type { TokenService } from '../../../src/modules/identity/domain/interfaces/TokenService';
import type { UserRepository } from '../../../src/modules/identity/domain/interfaces/UserRepository';

function contextFor(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function buildUser(overrides: Partial<Parameters<typeof User.create>[0]> = {}): User {
  return User.create({
    id: 'user-1',
    fullName: 'María Productora',
    document: '12345678',
    email: 'maria@example.com',
    phone: '3001234567',
    passwordHash: 'hash',
    roleId: 'role-1',
    roleName: 'productor',
    status: 'ACTIVO',
    acceptsDataProcessing: true,
    emailVerifiedAt: new Date('2026-11-03T00:00:00.000Z'),
    createdAt: new Date('2026-11-01T00:00:00.000Z'),
    ...overrides,
  });
}

describe('SessionAuthGuard', () => {
  const tokenService = {
    verifyAccessToken: jest.fn(),
  } as unknown as TokenService;
  const userRepository = {
    findById: jest.fn(),
  } as unknown as UserRepository;
  const guard = new SessionAuthGuard(tokenService, userRepository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rechaza una petición sin cookie de acceso', async () => {
    await expect(guard.canActivate(contextFor({ cookies: {} }))).rejects.toMatchObject({
      code: 'TOKEN_INVALID',
      statusCode: 401,
    });
  });

  it('rechaza un token inválido', async () => {
    (tokenService.verifyAccessToken as jest.Mock).mockImplementation(() => {
      throw new Error('invalid');
    });

    await expect(
      guard.canActivate(contextFor({ cookies: { access_token: 'malo' } })),
    ).rejects.toMatchObject({
      code: 'TOKEN_INVALID',
      statusCode: 401,
    });
  });

  it('rechaza un usuario inexistente o inactivo', async () => {
    (tokenService.verifyAccessToken as jest.Mock).mockReturnValue({
      userId: 'user-1',
      role: 'productor',
    });
    (userRepository.findById as jest.Mock).mockResolvedValue(buildUser({ status: 'INACTIVO' }));

    await expect(
      guard.canActivate(contextFor({ cookies: { access_token: 'token' } })),
    ).rejects.toMatchObject({ code: 'TOKEN_INVALID', statusCode: 401 });
  });

  it('rechaza un usuario sin correo verificado', async () => {
    (tokenService.verifyAccessToken as jest.Mock).mockReturnValue({
      userId: 'user-1',
      role: 'productor',
    });
    (userRepository.findById as jest.Mock).mockResolvedValue(buildUser({ emailVerifiedAt: null }));

    await expect(
      guard.canActivate(contextFor({ cookies: { access_token: 'token' } })),
    ).rejects.toMatchObject({ code: 'EMAIL_NOT_VERIFIED', statusCode: 403 });
  });

  it('adjunta el usuario autenticado a la petición', async () => {
    (tokenService.verifyAccessToken as jest.Mock).mockReturnValue({
      userId: 'user-1',
      role: 'productor',
    });
    (userRepository.findById as jest.Mock).mockResolvedValue(buildUser());
    const request: Record<string, unknown> = { cookies: { access_token: 'token' } };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request['user']).toEqual({
      id: 'user-1',
      fullName: 'María Productora',
      email: 'maria@example.com',
      role: 'productor',
    });
  });
});
