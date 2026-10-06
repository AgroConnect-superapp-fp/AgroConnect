import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/authClient';
import type { AuthSession, LoginPayload, PublicUser, RegisterPayload } from '../types';
import { AuthContext } from './authContext';

const STORAGE_KEY = 'agroconnect.session';

function readStoredSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed.usuario || !parsed.tokens?.refreshToken) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function persistSession(session: AuthSession | null): void {
  if (session) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  // Inicialización perezosa y síncrona desde localStorage: evita el efecto de
  // montaje con setState (regla react-hooks/set-state-in-effect) y el "flash"
  // de estado de carga.
  const [initialSession] = useState(() => readStoredSession());
  const [status, setStatus] = useState<'loading' | 'anonymous' | 'authenticated'>(
    initialSession ? 'authenticated' : 'anonymous'
  );
  const [usuario, setUsuario] = useState<PublicUser | null>(
    initialSession?.usuario ?? null
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    initialSession?.tokens.refreshToken ?? null
  );

  const applySession = useCallback((session: AuthSession) => {
    persistSession(session);
    setUsuario(session.usuario);
    setRefreshToken(session.tokens.refreshToken);
    setStatus('authenticated');
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const session = await authApi.login(payload);
      applySession(session);
    },
    [applySession]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const session = await authApi.register(payload);
      applySession(session);
    },
    [applySession]
  );

  const loginDemo = useCallback(() => {
    const demoSession: AuthSession = {
      usuario: {
        id: 'demo-visitante',
        nombre: 'Visitante Demo',
        correo: 'demo@agroconnect.local',
        rol: 'comprador_b2c',
        estado: 'ACTIVO',
        verificado: true,
        fechaRegistro: new Date().toISOString(),
      },
      tokens: {
        accessToken: 'demo-access',
        refreshToken: 'demo-refresh',
        expiresIn: 0,
      },
    };
    applySession(demoSession);
  }, [applySession]);

  const logout = useCallback(async () => {
    if (refreshToken && refreshToken !== 'demo-refresh') {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // La sesión local se cierra aunque el servidor no responda.
      }
    }

    persistSession(null);
    setUsuario(null);
    setRefreshToken(null);
    setStatus('anonymous');
  }, [refreshToken]);

  const value = useMemo(
    () => ({ status, usuario, login, register, loginDemo, logout }),
    [status, usuario, login, register, loginDemo, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
