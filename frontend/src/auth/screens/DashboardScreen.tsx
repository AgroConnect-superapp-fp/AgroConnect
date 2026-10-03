import { Button } from '../components/Button';
import { useAuth } from '../context/useAuth';
import { getRoleOption, ROLE_LABELS } from '../types';

interface DashboardScreenProps {
  onOpenMarketplace: () => void;
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
    nombre: 'Pulido del acceso',
    detalle: 'Verificación por correo, recuperación de contraseña y edición de perfil.',
    estado: 'Siguiente',
  },
  {
    nombre: 'Registro de productos',
    detalle: 'Nombre, precio, unidad e imágenes de tus cosechas con Cloudinary.',
    estado: 'Planificado',
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
  showSuccessBanner = false,
  onDismissSuccessBanner,
}: DashboardScreenProps): React.ReactElement {
  const { usuario, logout } = useAuth();

  if (!usuario) {
    return <div className="p-8 text-center text-gray-600">Cargando tu panel…</div>;
  }

  const roleOption = getRoleOption(usuario.rol);

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
              data-testid="dashboard-logout"
              onClick={() => void logout()}
              className="!min-h-10 !px-3 !py-2 text-sm"
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
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
