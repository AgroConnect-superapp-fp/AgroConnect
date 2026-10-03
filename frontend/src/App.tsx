import { lazy, Suspense, useState } from 'react';
import { AuthProvider } from './auth/context/AuthProvider';
import { useAuth } from './auth/context/useAuth';
import { WelcomeScreen } from './auth/screens/WelcomeScreen';
import { RoleSelectionScreen } from './auth/screens/RoleSelectionScreen';
import { RegisterScreen } from './auth/screens/RegisterScreen';
import { LoginScreen } from './auth/screens/LoginScreen';
import { ForgotPasswordScreen } from './auth/screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from './auth/screens/ResetPasswordScreen';
import { VerifyEmailScreen } from './auth/screens/VerifyEmailScreen';
import { DashboardScreen } from './auth/screens/DashboardScreen';
import type { RoleName } from './auth/types';

const MarketplacePrototype = lazy(() => import('./MarketplacePrototype'));

type View =
  | 'welcome'
  | 'roles'
  | 'register'
  | 'login'
  | 'forgot'
  | 'reset'
  | 'verify'
  | 'dashboard'
  | 'marketplace';

function LoadingScreen(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
      <div className="flex flex-col items-center gap-3">
        <span
          aria-hidden="true"
          className="h-12 w-12 animate-spin rounded-full border-4 border-agro-green/20 border-t-agro-green"
        />
        <p className="text-sm font-semibold text-agro-green">Cargando AgroConnect…</p>
      </div>
    </div>
  );
}

function AppContent(): React.ReactElement {
  const { status } = useAuth();
  const [resetToken, setResetToken] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get('resetToken')
  );
  const [verifyToken, setVerifyToken] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get('verifyToken')
  );
  const [view, setView] = useState<View>(() => {
    if (resetToken) return 'reset';
    if (verifyToken) return 'verify';
    return 'welcome';
  });
  const [selectedRole, setSelectedRole] = useState<RoleName>('productor');
  const [justRegistered, setJustRegistered] = useState(false);

  function clearResetToken(): void {
    window.history.replaceState({}, '', window.location.pathname);
    setResetToken(null);
  }

  function clearVerifyToken(): void {
    window.history.replaceState({}, '', window.location.pathname);
    setVerifyToken(null);
  }

  if (status === 'loading') {
    return <LoadingScreen />;
  }

  if (status === 'authenticated') {
    if (view === 'marketplace') {
      return (
        <div className="relative">
          <button
            type="button"
            onClick={() => setView('dashboard')}
            className="fixed left-4 top-4 z-[1200] min-h-12 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-agro-green shadow-lg ring-1 ring-black/10 hover:bg-emerald-50"
          >
            ← Volver al panel
          </button>
          <Suspense fallback={<LoadingScreen />}>
            <MarketplacePrototype />
          </Suspense>
        </div>
      );
    }

    return (
      <DashboardScreen
        onOpenMarketplace={() => setView('marketplace')}
        showSuccessBanner={justRegistered}
        onDismissSuccessBanner={() => setJustRegistered(false)}
      />
    );
  }

  if (view === 'roles') {
    return (
      <RoleSelectionScreen
        onSelect={(role) => {
          setSelectedRole(role);
          setView('register');
        }}
        onBack={() => setView('welcome')}
      />
    );
  }

  if (view === 'register') {
    return (
      <RegisterScreen
        role={selectedRole}
        onBack={() => setView('roles')}
        onGoToLogin={() => setView('login')}
        onSuccess={() => {
          setJustRegistered(true);
          setView('dashboard');
        }}
      />
    );
  }

  if (view === 'login') {
    return (
      <LoginScreen
        onBack={() => setView('welcome')}
        onGoToRegister={() => setView('roles')}
        onGoToForgotPassword={() => setView('forgot')}
        onSuccess={() => setView('dashboard')}
      />
    );
  }

  if (view === 'forgot') {
    return <ForgotPasswordScreen onBack={() => setView('login')} />;
  }

  if (view === 'verify' && verifyToken) {
    return (
      <VerifyEmailScreen
        token={verifyToken}
        onSuccess={() => {
          clearVerifyToken();
          setView('login');
        }}
        onRequestNewLink={() => {
          clearVerifyToken();
          setView('login');
        }}
      />
    );
  }

  if (view === 'reset' && resetToken) {
    return (
      <ResetPasswordScreen
        token={resetToken}
        onSuccess={() => {
          clearResetToken();
          setView('login');
        }}
        onRequestNewLink={() => {
          clearResetToken();
          setView('forgot');
        }}
      />
    );
  }

  return (
    <WelcomeScreen
      onCreateAccount={() => setView('roles')}
      onLogin={() => setView('login')}
    />
  );
}

export default function App(): React.ReactElement {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
