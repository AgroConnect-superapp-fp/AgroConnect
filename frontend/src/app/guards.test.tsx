// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext, type AuthContextValue } from '../auth/context/authContext';
import type { PublicUser, RoleName } from '../auth/types';

// Se stubean solo las pantallas pesadas: las guardas y `WelcomeRoute` se
// prueban contra el árbol de rutas real que usa la aplicación.
vi.mock('./screenRoutes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./screenRoutes')>();

  return {
    ...actual,
    RolesRoute: () => <p>roles</p>,
    RegisterRoute: () => <p>registro</p>,
    LoginRoute: () => <p>login</p>,
    ForgotPasswordRoute: () => <p>recuperar</p>,
    ResetRoute: () => <p>reset</p>,
    VerifyRoute: () => <p>verificar</p>,
    MarketplaceRoute: () => <p>marketplace</p>,
    DashboardRoute: () => <p>panel</p>,
    ProfileRoute: () => <p>perfil</p>,
    ModerationRoute: () => <p>moderacion</p>,
    PublishRoute: () => <p>publicar</p>,
  };
});

import { routes } from './routes';

afterEach(cleanup);

function createAuthValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    status: 'anonymous',
    restored: false,
    isDemo: false,
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

function authenticated(rol: RoleName, overrides: Partial<AuthContextValue> = {}) {
  return createAuthValue({
    status: 'authenticated',
    usuario: createUser(rol),
    ...overrides,
  });
}

function renderAt(initialEntry: string, auth: AuthContextValue) {
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] });
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
    renderAt('/panel', authenticated('productor'));

    expect(await screen.findByText('panel')).toBeTruthy();
  });
});

describe('RequireRole', () => {
  it('permite el paso al rol autorizado', async () => {
    renderAt('/moderacion', authenticated('administrador'));

    expect(await screen.findByText('moderacion')).toBeTruthy();
  });

  it('devuelve al panel a un usuario con otro rol', async () => {
    renderAt('/moderacion', authenticated('productor'));

    expect(await screen.findByText('panel')).toBeTruthy();
  });

  it('reserva la publicación para productores', async () => {
    renderAt('/publicar', authenticated('administrador'));

    expect(await screen.findByText('panel')).toBeTruthy();
  });
});

describe('PublicOnly', () => {
  it('expulsa del login a un usuario con sesión', async () => {
    renderAt('/login', authenticated('comprador_b2c'));

    expect(await screen.findByText('panel')).toBeTruthy();
  });

  it('deja entrar al login sin sesión', async () => {
    renderAt('/login', createAuthValue());

    expect(await screen.findByText('login')).toBeTruthy();
  });
});

describe('árbol de rutas real', () => {
  it('solo redirige la portada a /panel cuando la sesión se restauró', async () => {
    const router = renderAt('/', authenticated('productor', { restored: true }));

    expect(await screen.findByText('panel')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/panel');
  });

  it('mantiene la portada pública para login/demo recientes', async () => {
    renderAt('/', authenticated('productor'));

    expect(await screen.findByText(/Bienvenido a AgroConnect/i)).toBeTruthy();
  });

  it('traduce el enlace heredado ?resetToken= a /reset', async () => {
    const router = renderAt('/?resetToken=abc123', createAuthValue());

    expect(await screen.findByText('reset')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/reset');
  });

  it('traduce el enlace heredado ?verifyToken= a /verificar', async () => {
    const router = renderAt('/?verifyToken=xyz789', createAuthValue());

    expect(await screen.findByText('verificar')).toBeTruthy();
    expect(router.state.location.pathname).toBe('/verificar');
  });

  it('muestra el 404 y devuelve al inicio a un visitante', async () => {
    renderAt('/ruta-inexistente', createAuthValue());

    expect(await screen.findByText('Esta página no existe')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Volver al inicio' })).toBeTruthy();
  });

  it('devuelve al panel a un usuario autenticado desde el 404', async () => {
    renderAt('/ruta-inexistente', authenticated('productor'));

    expect(await screen.findByText('Esta página no existe')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Volver al panel' })).toBeTruthy();
  });
});
