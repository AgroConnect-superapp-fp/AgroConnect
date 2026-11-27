import { useState } from 'react';
import { Button } from '../components/Button';
import { useAuth } from '../context/useAuth';
import { getRoleOption, ROLE_LABELS } from '../types';

interface DashboardScreenProps {
  onOpenMarketplace: () => void;
  onPublishProduct: () => void;
  onOpenProfile: () => void;
  onOpenModeration: () => void;
  showSuccessBanner?: boolean;
  onDismissSuccessBanner?: () => void;
}

const ROLE_WELCOME: Record<string, string> = {
  productor:
    'Desde tu panel podrás publicar tus cosechas, gestionar tu inventario y recibir pedidos directos de compradores.',
  comprador_b2c:
    'Explora cosechas frescas de productores locales y recibe tus pedidos en la puerta de tu casa.',
  comprador_b2b:
    'Abastece tu negocio con cosechas locales, acuerda volúmenes y programa entregas.',
  transportista:
    'Encuentra viajes de cosechas entre productores y compradores, y gestiona tus entregas.',
  administrador:
    'Acompaña a la comunidad: verifica usuarios, modera publicaciones y cuida la calidad de la plataforma.',
};

const NEXT_INCREMENTS = [
  {
    nombre: 'Edición de perfil',
    detalle: 'Consulta y actualiza los datos de tu finca, empresa o vehículo.',
    estado: 'Disponible',
  },
  {
    nombre: 'Inventario del productor',
    detalle: 'Consulta, actualización y alertas de stock de tus productos.',
    estado: 'Planificado',
  },
  {
    nombre: 'Búsqueda por proximidad',
    detalle: 'Encuentra fincas y productos cerca de ti con PostGIS.',
    estado: 'Planificado',
  },
];

export function DashboardScreen({
  onOpenMarketplace,
  onPublishProduct,
  onOpenProfile,
  onOpenModeration,
  showSuccessBanner = false,
  onDismissSuccessBanner,
}: DashboardScreenProps): React.ReactElement {
  const { usuario, logout } = useAuth();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  if (!usuario) {
    return <div className="p-8 text-center text-gray-600">Cargando tu panel…</div>;
  }

  const roleOption = getRoleOption(usuario.rol);

  async function handleLogout(): Promise<void> {
    setLogoutError(null);
    try {
      await logout();
    } catch {
      setLogoutError(
        'No fue posible cerrar la sesión en el servidor. Revisa tu conexión e inténtalo de nuevo.'
      );
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50">
      <header className="border-b border-emerald-100 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-2xl">
              🌱
            </span>
            <span className="text-xl font-bold text-agro-green">AgroConnect</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p
                data-testid="dashboard-usuario"
                className="text-sm font-semibold text-gray-900"
              >
                {usuario.nombre}
              </p>
              <p className="text-xs text-gray-500">{ROLE_LABELS[usuario.rol]}</p>
            </div>
            <Button
              variant="ghost"
              data-testid="dashboard-profile"
              onClick={onOpenProfile}
              className="!min-h-10 !px-3 !py-2 text-sm"
            >
              Mi perfil
            </Button>
            <Button
              variant="ghost"
              data-testid="dashboard-logout"
              onClick={() => void handleLogout()}
              className="!min-h-10 !px-3 !py-2 text-sm"
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {logoutError && (
          <div
            role="alert"
            data-testid="logout-error"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {logoutError}
          </div>
        )}
        {showSuccessBanner && (
          <div
            role="status"
            data-testid="register-success"
            className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3"
          >
            <p className="text-sm font-medium text-emerald-900">
              ¡Registro exitoso! Tu cuenta de <strong>{roleOption.titulo}</strong> quedó
              creada y ya iniciaste sesión con el correo <strong>{usuario.correo}</strong>
              .
            </p>
            <button
              type="button"
              aria-label="Cerrar mensaje"
              onClick={onDismissSuccessBanner}
              className="min-h-8 min-w-8 rounded-full text-emerald-900 hover:bg-emerald-100"
            >
              ✕
            </button>
          </div>
        )}

        <section
          data-testid="dashboard-bienvenida"
          className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <span aria-hidden="true" className="text-4xl">
              {roleOption.icono}
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                ¡Hola, {usuario.nombre.split(' ')[0]}!
              </h1>
              <p className="mt-1 text-sm font-semibold text-agro-green">
                Panel de {roleOption.titulo}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {ROLE_WELCOME[usuario.rol]}
              </p>
            </div>
          </div>
        </section>

        {usuario.rol === 'administrador' && (
          <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-amber-950">Moderación pendiente</h2>
            <p className="mt-1 text-sm text-amber-900">
              Revisa las publicaciones nuevas antes de que aparezcan en el marketplace.
            </p>
            <Button
              variant="secondary"
              data-testid="dashboard-moderation"
              onClick={onOpenModeration}
              className="mt-3"
            >
              Revisar publicaciones
            </Button>
          </section>
        )}

        {usuario.rol === 'productor' && (
          <section className="mt-6 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">Publica tu cosecha</h2>
            <p className="mt-1 text-sm text-gray-600">
              Registra el producto, sube imágenes a Cloudinary y publícalo en el
              marketplace.
            </p>
            <Button
              data-testid="dashboard-publish"
              onClick={onPublishProduct}
              className="mt-3"
            >
              Publicar producto
            </Button>
          </section>
        )}

        <section className="mt-6">
          <h2 className="text-lg font-bold text-gray-900">Lo que viene para tu panel</h2>
          <p className="mt-1 text-sm text-gray-600">
            Estos son los siguientes incrementos del MVP, en el orden que define la ruta
            del proyecto.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {NEXT_INCREMENTS.map((increment) => (
              <article
                key={increment.nombre}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-gray-900">{increment.nombre}</h3>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                    {increment.estado}
                  </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
                  {increment.detalle}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/60 p-5">
          <h2 className="text-base font-bold text-emerald-900">Prototipo del mercado</h2>
          <p className="mt-1 text-sm text-emerald-900/80">
            Explora la vista previa del mercado con fincas en el mapa. Está en migración
            hacia el backend propio de AgroConnect.
          </p>
          <Button
            variant="secondary"
            data-testid="dashboard-marketplace"
            onClick={onOpenMarketplace}
            className="mt-3"
          >
            Explorar prototipo del mercado
          </Button>
        </section>
      </main>

      <footer className="px-4 pb-8 text-center text-xs text-gray-500">
        AgroConnect · Conectando el campo con la tecnología · SENA ADSO 2026
      </footer>
    </div>
  );
}
