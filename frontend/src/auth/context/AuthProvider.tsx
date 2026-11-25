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
  const [restored, setRestored] = useState(false);
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

  const applySession = useCallback(
    (session: AuthSession, options?: { restored?: boolean }) => {
      setUsuario(session.usuario);
      setStatus('authenticated');
      // Solo el refresh silencioso al arrancar marca `restored`: login y demo
      // tienen su propia navegación y no deben rebotar a /panel.
      setRestored(options?.restored ?? false);
    },
    []
  );

  useEffect(() => {
    if (refreshInFlight.current) {
      return;
    }

    refreshInFlight.current = authApi
      .refresh()
      .then((session) => applySession(session, { restored: true }))
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

  const register = useCallback(async (payload: RegisterPayload) => {
    // D5: el registro no emite sesión. La cuenta debe verificar el correo
    // antes de poder iniciar sesión.
    await authApi.register(payload);
  }, []);

  const isDemo = usuario?.id === DEMO_USER_ID;

  const loginDemo = useCallback(() => {
    // Nunca se reemplaza una sesión real por la demo: la cookie httpOnly
    // seguiría viva y el logout posterior podría no revocarla.
    if (status === 'authenticated' && !isDemo) {
      return;
    }

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
    });
  }, [applySession, status, isDemo]);

  useEffect(() => {
    const handleExpired = (): void => {
      setUsuario(null);
      setStatus('anonymous');
      setRestored(false);
    };

    window.addEventListener('agroconnect:session-expired', handleExpired);
    return () => window.removeEventListener('agroconnect:session-expired', handleExpired);
  }, []);

  const logout = useCallback(async () => {
    if (isDemo) {
      // Puede existir una cookie real si el usuario entró a la demo antes de
      // esta sesión: se intenta revocar en el servidor y, pase lo que pase, se
      // limpia el estado local (la demo no tiene sesión que conservar).
      await authApi.logout().catch(() => undefined);

      setUsuario(null);
      setStatus('anonymous');
      setRestored(false);
      return;
    }

    // Sesión real: si el servidor falla, NO limpiamos el estado local porque
    // la cookie httpOnly seguiría viva y un reload volvería a autenticar.
    await authApi.logout();

    setUsuario(null);
    setStatus('anonymous');
    setRestored(false);
  }, [isDemo]);

  const value = useMemo(
    () => ({ status, restored, isDemo, usuario, login, register, loginDemo, logout }),
    [status, restored, isDemo, usuario, login, register, loginDemo, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
