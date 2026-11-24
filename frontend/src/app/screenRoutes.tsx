import { Suspense, lazy } from 'react';
import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router';
import { useAuth } from '../auth/context/useAuth';
import { LoadingScreen } from './LoadingScreen';
import { legacyTokenTarget, parseRole, safeReturnTo } from './routing';

// Todas las pantallas se cargan bajo demanda: el bundle inicial solo trae el
// router, las guardas y el proveedor de sesión.
const WelcomeScreen = lazy(() =>
  import('../auth/screens/WelcomeScreen').then((module) => ({
    default: module.WelcomeScreen,
  }))
);
const RoleSelectionScreen = lazy(() =>
  import('../auth/screens/RoleSelectionScreen').then((module) => ({
    default: module.RoleSelectionScreen,
  }))
);
const RegisterScreen = lazy(() =>
  import('../auth/screens/RegisterScreen').then((module) => ({
    default: module.RegisterScreen,
  }))
);
const LoginScreen = lazy(() =>
  import('../auth/screens/LoginScreen').then((module) => ({
    default: module.LoginScreen,
  }))
);
const ForgotPasswordScreen = lazy(() =>
  import('../auth/screens/ForgotPasswordScreen').then((module) => ({
    default: module.ForgotPasswordScreen,
  }))
);
const ResetPasswordScreen = lazy(() =>
  import('../auth/screens/ResetPasswordScreen').then((module) => ({
    default: module.ResetPasswordScreen,
  }))
);
const VerifyEmailScreen = lazy(() =>
  import('../auth/screens/VerifyEmailScreen').then((module) => ({
    default: module.VerifyEmailScreen,
  }))
);
const DashboardScreen = lazy(() =>
  import('../auth/screens/DashboardScreen').then((module) => ({
    default: module.DashboardScreen,
  }))
);
const ProfileScreen = lazy(() =>
  import('../auth/screens/ProfileScreen').then((module) => ({
    default: module.ProfileScreen,
  }))
);
const ModerationScreen = lazy(() =>
  import('../auth/screens/ModerationScreen').then((module) => ({
    default: module.ModerationScreen,
  }))
);
const PublishProductScreen = lazy(() =>
  import('../marketplace/PublishProductScreen').then((module) => ({
    default: module.PublishProductScreen,
  }))
);
const MarketplacePrototype = lazy(() => import('../MarketplacePrototype'));

/** Frontera de suspensión única para las rutas diferidas. */
export function SuspenseGate(): React.ReactElement {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

export function WelcomeRoute(): React.ReactElement {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, restored, loginDemo } = useAuth();

  const legacyTarget = legacyTokenTarget(location.search);

  if (legacyTarget) {
    return <Navigate to={legacyTarget} replace />;
  }

  // Solo una sesión restaurada al arrancar salta la portada: un login o la
  // demo tienen su propia navegación y no deben rebotar a /panel.
  if (status === 'authenticated' && restored) {
    return <Navigate to="/panel" replace />;
  }

  return (
    <WelcomeScreen
      onCreateAccount={() => navigate('/roles')}
      onLogin={() => navigate('/login')}
      onDemo={() => {
        loginDemo();
        navigate('/marketplace');
      }}
    />
  );
}

export function RolesRoute(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <RoleSelectionScreen
      onSelect={(role) => navigate(`/registro?rol=${role}`)}
      onBack={() => navigate('/')}
    />
  );
}

export function RegisterRoute(): React.ReactElement {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const role = parseRole(params.get('rol'));

  return (
    <RegisterScreen
      role={role}
      onBack={() => navigate('/roles')}
      onGoToLogin={() => navigate('/login')}
    />
  );
}

export function LoginRoute(): React.ReactElement {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = safeReturnTo(params.get('returnTo'));

  return (
    <LoginScreen
      onBack={() => navigate('/')}
      onGoToRegister={() => navigate('/roles')}
      onGoToForgotPassword={() => navigate('/recuperar')}
      onSuccess={() => navigate(returnTo, { replace: true })}
    />
  );
}

export function ForgotPasswordRoute(): React.ReactElement {
  const navigate = useNavigate();

  return <ForgotPasswordScreen onBack={() => navigate('/login')} />;
}

export function ResetRoute(): React.ReactElement {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');

  if (!token) {
    return <Navigate to="/recuperar" replace />;
  }

  return (
    <ResetPasswordScreen
      token={token}
      onSuccess={() => navigate('/login', { replace: true })}
      onRequestNewLink={() => navigate('/recuperar', { replace: true })}
    />
  );
}

export function VerifyRoute(): React.ReactElement {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <VerifyEmailScreen
      token={token}
      onSuccess={() => navigate('/login', { replace: true })}
      onRequestNewLink={() => navigate('/login', { replace: true })}
    />
  );
}

export function DashboardRoute(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <DashboardScreen
      onOpenMarketplace={() => navigate('/marketplace')}
      onPublishProduct={() => navigate('/publicar')}
      onOpenProfile={() => navigate('/perfil')}
      onOpenModeration={() => navigate('/moderacion')}
    />
  );
}

export function ProfileRoute(): React.ReactElement {
  const navigate = useNavigate();

  return <ProfileScreen onBack={() => navigate('/panel')} />;
}

export function ModerationRoute(): React.ReactElement {
  const navigate = useNavigate();

  return <ModerationScreen onBack={() => navigate('/panel')} />;
}

export function PublishRoute(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <PublishProductScreen
      onBack={() => navigate('/panel')}
      onPublished={() => navigate('/marketplace')}
    />
  );
}

export function MarketplaceRoute(): React.ReactElement {
  const navigate = useNavigate();
  const { status } = useAuth();
  const authenticated = status === 'authenticated';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => navigate(authenticated ? '/panel' : '/')}
        className="fixed left-4 top-4 z-[1200] min-h-12 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-agro-green shadow-lg ring-1 ring-black/10 hover:bg-emerald-50"
      >
        {authenticated ? '← Volver al panel' : '← Volver al inicio'}
      </button>
      <Suspense fallback={<LoadingScreen />}>
        <MarketplacePrototype />
      </Suspense>
    </div>
  );
}

export function NotFoundRoute(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-emerald-50 px-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-agro-green">
        Error 404
      </p>
      <h1 className="font-serif text-3xl text-slate-900">Esta página no existe</h1>
      <p className="max-w-md text-slate-600">
        Revisa la dirección o vuelve al inicio para continuar.
      </p>
      <button
        type="button"
        onClick={() => navigate('/', { replace: true })}
        className="min-h-12 rounded-lg bg-agro-green px-6 text-sm font-semibold text-white hover:bg-agro-green/90"
      >
        Volver al inicio
      </button>
    </main>
  );
}
