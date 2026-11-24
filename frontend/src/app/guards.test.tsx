// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../auth/context/authContext';
import type { PublicUser, RoleName } from '../auth/types';
import { PublicOnly, RequireAuth, RequireRole, SessionGate } from './guards';

afterEach(cleanup);

function createAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'anonymous',
    restored: false,
    usuario: null,
    login: vi.fn(async () => undefined),
    register: vi.fn(async () => undefined),
    loginDemo: vi.fn(),
    logout: vi.fn(async () => undefined),
    ...overrides,
  };
}

function createUser(rol: RoleName): PublicUser {
  return {
    id: 'usuario-1',
    nombre: 'Usuario de prueba',
    correo: 'prueba@example.com',
    rol,
    estado: 'ACTIVO',
    verificado: true,
    fechaRegistro: '2026-01-01T00:00:00.000Z',
  };
}

const testRoutes: RouteObject[] = [
  {
    element: <SessionGate />,
    children: [
      {
        element: <PublicOnly />,
        children: [{ path: '/login', element: <p>login</p> }],
      },
      { path: '/', element: <p>inicio</p> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/panel', element: <p>panel</p> },
          {
            path: '/moderacion',
            element: (
              <RequireRole roles={['administrador']}>
                <p>moderacion</p>
              </RequireRole>
            ),
          },
          {
            path: '/publicar',
            element: (
              <RequireRole roles={['productor']}>
                <p>publicar</p>
              </RequireRole>
            ),
          },
        ],
      },
    ],
  },
];

function renderAt(initialEntry: string, auth: AuthContextValue) {
  const router = createMemoryRouter(testRoutes, { initialEntries: [initialEntry] });
  render(
    <AuthContext.Provider value={auth}>
      <RouterProvider router={router} />
    </AuthContext.Provider>
  );
  return router;
}

describe('SessionGate', () => {
  it('muestra la pantalla de carga mientras se restaura la sesión', () => {
    renderAt('/panel', createAuthValue({ status: 'loading' }));

    expect(screen.getByText('Cargando AgroConnect…')).toBeTruthy();
  });
});

describe('RequireAuth', () => {
  it('redirige al login conservando la ruta original en returnTo', async () => {
    const router = renderAt('/moderacion?limit=10', createAuthValue());

    expect(await screen.findByText('login')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/login');
    expect(router.state.location.search).toBe('?returnTo=%2Fmoderacion%3Flimit%3D10');
  });

  it('permite el paso a un usuario autenticado', async () => {
    renderAt(
      '/panel',
      createAuthValue({ status: 'authenticated', usuario: createUser('productor') })
    );

    expect(await screen.findByText('panel')).toBeTruthy();
  });
});

describe('RequireRole', () => {
  it('permite el paso al rol autorizado', async () => {
    renderAt(
      '/moderacion',
      createAuthValue({ status: 'authenticated', usuario: createUser('administrador') })
    );

    expect(await screen.findByText('moderacion')).toBeTruthy();
  });

  it('devuelve al panel a un usuario con otro rol', async () => {
    renderAt(
      '/moderacion',
      createAuthValue({ status: 'authenticated', usuario: createUser('productor') })
    );

    expect(await screen.findByText('panel')).toBeTruthy();
  });

  it('reserva la publicación para productores', async () => {
    renderAt(
      '/publicar',
      createAuthValue({ status: 'authenticated', usuario: createUser('administrador') })
    );

    expect(await screen.findByText('panel')).toBeTruthy();
  });
});

describe('PublicOnly', () => {
  it('expulsa del login a un usuario con sesión', async () => {
    renderAt(
      '/login',
      createAuthValue({ status: 'authenticated', usuario: createUser('comprador_b2c') })
    );

    expect(await screen.findByText('panel')).toBeTruthy();
  });

  it('deja entrar al login sin sesión', async () => {
    renderAt('/login', createAuthValue());

    expect(await screen.findByText('login')).toBeTruthy();
  });
});
