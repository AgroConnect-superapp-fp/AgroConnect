import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/Button';

interface WelcomeScreenProps {
  onCreateAccount: () => void;
  onLogin: () => void;
}

export function WelcomeScreen({
  onCreateAccount,
  onLogin,
}: WelcomeScreenProps): React.ReactElement {
  return (
    <AuthShell
      title="Bienvenido a AgroConnect"
      subtitle="La plataforma que conecta el campo colombiano con compradores de todo el país, sin intermediarios."
    >
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icono: '🌾', texto: 'Cosechas directas del productor' },
            { icono: '📍', texto: 'Fincas ubicadas en el mapa' },
            { icono: '🤝', texto: 'Precios justos, trato directo' },
          ].map((item) => (
            <div
              key={item.texto}
              className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-sm text-emerald-900"
            >
              <span aria-hidden="true" className="text-xl">
                {item.icono}
              </span>
              <span>{item.texto}</span>
            </div>
          ))}
        </div>

        <Button onClick={onCreateAccount} fullWidth>
          Crear cuenta
        </Button>
        <Button onClick={onLogin} variant="ghost" fullWidth>
          Iniciar sesión
        </Button>
      </div>
    </AuthShell>
  );
}
