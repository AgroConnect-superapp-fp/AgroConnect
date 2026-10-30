import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { authApi } from '../api/authClient';
import type { AuthSession, LoginPayload, PublicUser, RegisterPayload } from '../types';
import { AuthContext } from './authContext';

const DEMO_USER_ID = 'demo-visitante';

export function AuthProvider({ children }: { children: ReactNode }): React.ReactElement {
  // La sesión se restaura con un refresh silencioso contra la cookie httpOnly:
  // el JavaScript no puede leerla, así que no existe inicialización síncrona
  // posible. Mientras resuelve, el estado es 'loading' (App muestra un spinner).
  const [status, setStatus] = useState<'loading' | 'anonymous' | 'authenticated'>(
    'loading'
  );
  const [usuario, setUsuario] = useState<PublicUser | null>(null);
  // Cookie-only puro: NINGÚN token vive en JavaScript. apps/api emite las
  // cookies httpOnly `access_token` (corta vida) y `refresh_token` (7 días),
  // y el navegador las adjunta a cada request vía `credentials: 'include'`.
  // Guardar el access token en memoria duplicaría la cookie y reabriría la
  // vía de lectura por XSS que esta migración cierra.

  // Refresh silencioso serializado: en StrictMode el provider monta dos veces
  // y dos renovaciones concurrentes con la misma cookie rotarían el token dos
  // veces (la segunda fallaría porque la primera ya revocó el anterior). La
  // promesa compartida garantiza UNA sola renovación por ciclo de montaje.
  const refreshInFlight = useRef<Promise<void> | null>(null);

  const applySession = useCallback((session: AuthSession) => {
    setUsuario(session.usuario);
    setStatus('authenticated');
  }, []);

  useEffect(() => {
    if (refreshInFlight.current) {
      return;
    }

    refreshInFlight.current = authApi
      .refresh()
      .then(applySession)
      .catch(() => {
        // Sin cookie válida no hay sesión: queda anónimo.
        setStatus('anonymous');
      })
      .finally(() => {
        refreshInFlight.current = null;
      });
  }, [applySession]);

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
    // Sesión demo SOLO en memoria: no toca la API ni persiste nada.
    applySession({
      usuario: {
        id: DEMO_USER_ID,
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
    });
  }, [applySession]);

  const logout = useCallback(async () => {
    // La sesión demo no tiene cookie de servidor: no hay nada que revocar.
    if (usuario?.id !== DEMO_USER_ID) {
      try {
        await authApi.logout();
      } catch {
        // La sesión local se cierra aunque el servidor no responda.
      }
    }

    setUsuario(null);
    setStatus('anonymous');
  }, [usuario]);

  const value = useMemo(
    () => ({ status, usuario, login, register, loginDemo, logout }),
    [status, usuario, login, register, loginDemo, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
