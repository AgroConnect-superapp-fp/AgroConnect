import { AuthShell } from '../components/AuthShell';
import { ROLE_OPTIONS, type RoleName } from '../types';

interface RoleSelectionScreenProps {
  onSelect: (role: RoleName) => void;
  onBack: () => void;
}

export function RoleSelectionScreen({
  onSelect,
  onBack,
}: RoleSelectionScreenProps): React.ReactElement {
  return (
    <AuthShell
      title="¿Cómo vas a usar AgroConnect?"
      subtitle="Elige el perfil con el que crearás tu cuenta. Podrás acceder a las funcionalidades según tu rol."
      footer={
        <button
          type="button"
          onClick={onBack}
          className="min-h-12 font-semibold text-agro-green underline-offset-4 hover:underline"
        >
          Volver al inicio
        </button>
      }
    >
      <div className="flex flex-col gap-3">
        {ROLE_OPTIONS.map((role) => (
          <button
            key={role.id}
            type="button"
            data-testid={`role-card-${role.id}`}
            onClick={() => onSelect(role.id)}
            className="flex min-h-16 w-full items-center gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left transition hover:border-agro-green hover:bg-emerald-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-agro-green/30"
          >
            <span aria-hidden="true" className="text-3xl">
              {role.icono}
            </span>
            <span className="flex flex-col">
              <span className="text-base font-bold text-gray-900">{role.titulo}</span>
              <span className="text-sm text-gray-600">{role.descripcion}</span>
            </span>
          </button>
        ))}
      </div>
    </AuthShell>
  );
}
