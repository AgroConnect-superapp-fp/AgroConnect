import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/context/useAuth';
import type { RoleName } from '../auth/types';
import { LoadingScreen } from './LoadingScreen';

/**
 * Espera la restauración de sesión antes de montar cualquier ruta. Evita el
 * parpadeo de pantallas públicas y que una guarda redirija con estado
 * `loading`.
 */
export function SessionGate(): React.ReactElement {
  const { status } = useAuth();

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  return <Outlet />;
}

/**
 * Exige sesión activa. Conserva la ruta original en `returnTo` para volver
 * tras autenticarse (deep links del panel, la moderación o la publicación).
 */
export function RequireAuth(): React.ReactElement {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'anonymous') {
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  return <Outlet />;
}

/**
 * Restringe una ruta a los roles indicados. Se usa dentro de `RequireAuth`,
 * por lo que el único caso posible es un usuario autenticado con otro rol.
 */
export function RequireRole({
  roles,
  children,
}: {
  roles: readonly RoleName[];
  children: React.ReactNode;
}): React.ReactElement {
  const { usuario } = useAuth();

  if (!usuario || !roles.includes(usuario.rol)) {
    return <Navigate to="/panel" replace />;
  }

  return <>{children}</>;
}

/**
 * Evita que un usuario autenticado vuelva al formulario de login. El resto de
 * pantallas públicas (registro, recuperación, verificación) siguen accesibles
 * porque sus enlaces llegan por correo y deben funcionar con sesión activa.
 */
export function PublicOnly(): React.ReactElement {
  const { status } = useAuth();

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'authenticated') {
    return <Navigate to="/panel" replace />;
  }

  return <Outlet />;
}
