// @vitest-environment jsdom
import { StrictMode, type ReactElement } from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '../api/authClient';
import type { AuthSession } from '../types';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';

vi.mock('../api/authClient', () => ({
  authApi: {
    refresh: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

const mockedRefresh = vi.mocked(authApi.refresh);
const mockedLogin = vi.mocked(authApi.login);
const mockedLogout = vi.mocked(authApi.logout);

// Espías sobre el prototipo de Storage: cualquier uso de localStorage por
// parte del provider (leer, escribir o borrar) queda registrado aquí. El
// contrato de la migración cookie-only es que NINGÚN token ni sesión toca
// el almacenamiento del navegador.
const storageSpies = {
  getItem: vi.spyOn(Storage.prototype, 'getItem'),
  setItem: vi.spyOn(Storage.prototype, 'setItem'),
  removeItem: vi.spyOn(Storage.prototype, 'removeItem'),
};

const session: AuthSession = {
  usuario: {
    id: 'u-1',
    nombre: 'María Fernanda López',
    correo: 'maria.lopez@example.com',
    rol: 'productor',
    estado: 'ACTIVO',
    verificado: true,
    fechaRegistro: '2026-01-01T00:00:00.000Z',
  },
  tokens: { accessToken: 'access', refreshToken: 'refresh', expiresIn: 900 },
};

function expectNothingPersisted(): void {
  expect(storageSpies.getItem).not.toHaveBeenCalled();
  expect(storageSpies.setItem).not.toHaveBeenCalled();
  expect(storageSpies.removeItem).not.toHaveBeenCalled();
}

function AuthProbe(): ReactElement {
  const { status, usuario, login, loginDemo, logout } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="usuario">{usuario?.nombre ?? 'sin-sesion'}</span>
      <button
        onClick={() =>
          void login({ correo: 'maria.lopez@example.com', password: 'Agro2026*' })
        }
      >
        login
      </button>
      <button onClick={loginDemo}>demo</button>
      <button onClick={() => void logout()}>logout</button>
    </div>
  );
}

function mountAuth(withStrictMode = false): void {
  const tree = (
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>
  );
  render(withStrictMode ? <StrictMode>{tree}</StrictMode> : tree);
}

async function click(name: string): Promise<void> {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }));
  });
}

describe('AuthProvider (sesión cookie-only)', () => {
  // Sin `globals: true` en vitest, testing-library no auto-desmonta: sin este
  // cleanup los renders se acumulan y los queries encuentran duplicados.
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('el montaje sin cookie válida deja la sesión anónima sin tocar localStorage', async () => {
    mockedRefresh.mockRejectedValue(new Error('sin cookie'));

    mountAuth();

    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('anonymous')
    );
    expect(screen.getByTestId('usuario').textContent).toBe('sin-sesion');
    expectNothingPersisted();
  });

  it('el login restaura la sesión solo en memoria', async () => {
    mockedRefresh.mockRejectedValue(new Error('sin cookie'));
    mockedLogin.mockResolvedValue(session);

    mountAuth();
    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('anonymous')
    );

    await click('login');

    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('authenticated')
    );
    expect(screen.getByTestId('usuario').textContent).toBe('María Fernanda López');
    expectNothingPersisted();
  });

  it('el logout limpia el estado y revoca la cookie sin tocar localStorage', async () => {
    mockedRefresh.mockRejectedValue(new Error('sin cookie'));
    mockedLogin.mockResolvedValue(session);
    mockedLogout.mockResolvedValue(undefined);

    mountAuth();
    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('anonymous')
    );
    await click('login');
    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('authenticated')
    );

    await click('logout');

    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('anonymous')
    );
    expect(mockedLogout).toHaveBeenCalledTimes(1);
    expectNothingPersisted();
  });

  it('la sesión demo vive solo en memoria y su cierre no llama a la API', async () => {
    mockedRefresh.mockRejectedValue(new Error('sin cookie'));

    mountAuth();
    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('anonymous')
    );

    await click('demo');
    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('authenticated')
    );
    expect(screen.getByTestId('usuario').textContent).toBe('Visitante Demo');

    await click('logout');
    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('anonymous')
    );
    expect(mockedLogout).not.toHaveBeenCalled();
    expectNothingPersisted();
  });

  it('en StrictMode el refresh silencioso del montaje se ejecuta una sola vez', async () => {
    mockedRefresh.mockResolvedValue(session);

    mountAuth(true);

    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('authenticated')
    );
    expect(mockedRefresh).toHaveBeenCalledTimes(1);
    expectNothingPersisted();
  });
});
