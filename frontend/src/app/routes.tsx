import type { RouteObject } from 'react-router';
import { PublicOnly, RequireAuth, RequireRole, SessionGate } from './guards';
import {
  DashboardRoute,
  ForgotPasswordRoute,
  LoginRoute,
  MarketplaceRoute,
  ModerationRoute,
  NotFoundRoute,
  ProfileRoute,
  PublishRoute,
  RegisterRoute,
  ResetRoute,
  RolesRoute,
  SuspenseGate,
  VerifyRoute,
  WelcomeRoute,
} from './screenRoutes';

/**
 * Árbol de rutas de AgroConnect.
 *
 * Se exporta como dato puro para poder montarlo con `createMemoryRouter` en las
 * pruebas sin tocar `window.history` y para que el árbol probado sea el mismo
 * que usa la aplicación.
 */
export const routes: RouteObject[] = [
  {
    element: <SessionGate />,
    children: [
      {
        element: <SuspenseGate />,
        children: [
          {
            // El login es la única pantalla que expulsa a un usuario con
            // sesión; los enlaces de correo deben seguir funcionando.
            element: <PublicOnly />,
            children: [{ path: '/login', element: <LoginRoute /> }],
          },
          { path: '/', element: <WelcomeRoute /> },
          { path: '/roles', element: <RolesRoute /> },
          { path: '/registro', element: <RegisterRoute /> },
          { path: '/recuperar', element: <ForgotPasswordRoute /> },
          { path: '/reset', element: <ResetRoute /> },
          { path: '/verificar', element: <VerifyRoute /> },
          { path: '/marketplace', element: <MarketplaceRoute /> },
          {
            element: <RequireAuth />,
            children: [
              { path: '/panel', element: <DashboardRoute /> },
              { path: '/perfil', element: <ProfileRoute /> },
              {
                path: '/moderacion',
                element: (
                  <RequireRole roles={['administrador']}>
                    <ModerationRoute />
                  </RequireRole>
                ),
              },
              {
                path: '/publicar',
                element: (
                  <RequireRole roles={['productor']}>
                    <PublishRoute />
                  </RequireRole>
                ),
              },
            ],
          },
          { path: '*', element: <NotFoundRoute /> },
        ],
      },
    ],
  },
];
