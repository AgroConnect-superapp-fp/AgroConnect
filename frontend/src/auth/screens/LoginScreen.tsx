import { useState, type FormEvent } from 'react';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { useAuth } from '../context/useAuth';
import { loginSchema, zodErrorsToFields, type FieldErrors } from '../schemas/authSchemas';
import { ApiError } from '../api/authClient';

interface LoginScreenProps {
  onBack: () => void;
  onGoToRegister: () => void;
  onGoToForgotPassword: () => void;
  onSuccess: () => void;
}

export function LoginScreen({
  onBack,
  onGoToRegister,
  onGoToForgotPassword,
  onSuccess,
}: LoginScreenProps): React.ReactElement {
  const { login } = useAuth();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setGeneralError(null);

    const parsed = loginSchema.safeParse({ correo, password });
    if (!parsed.success) {
      setFieldErrors(zodErrorsToFields(parsed.error));
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      await login(parsed.data);
      onSuccess();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'INVALID_CREDENTIALS') {
          setGeneralError('Correo o contraseña incorrectos');
        } else if (error.code === 'RATE_LIMITED') {
          setGeneralError('Demasiados intentos. Espera unos minutos e intenta de nuevo.');
        } else if (error.status === 422 && error.details) {
          setFieldErrors(
            Object.fromEntries(
              error.details.map((detail) => {
                const [key, ...rest] = detail.split(': ');
                return [key, rest.join(': ')];
              })
            )
          );
        } else {
          setGeneralError(error.message);
        }
      } else {
        setGeneralError('Ocurrió un error inesperado. Intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Inicia sesión"
      subtitle="Accede a tu panel para gestionar tus cosechas, pedidos y entregas."
      footer={
        <div className="flex flex-col items-center gap-2">
          <span>
            ¿Aún no tienes cuenta?{' '}
            <button
              type="button"
              onClick={onGoToRegister}
              className="min-h-12 font-semibold text-agro-green underline-offset-4 hover:underline"
            >
              Crear cuenta
            </button>
          </span>
          <button
            type="button"
            onClick={onGoToForgotPassword}
            className="min-h-12 font-medium text-agro-green underline-offset-4 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
          <button
            type="button"
            onClick={onBack}
            className="min-h-12 text-gray-500 underline-offset-4 hover:underline"
          >
            Volver al inicio
          </button>
        </div>
      }
    >
      <form
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
        className="flex flex-col gap-4"
      >
        {generalError && (
          <div
            role="alert"
            data-testid="login-error"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {generalError}
          </div>
        )}

        <FormField
          id="login-correo"
          label="Correo electrónico"
          type="email"
          value={correo}
          onChange={setCorreo}
          error={fieldErrors.correo}
          placeholder="tucorreo@ejemplo.com"
          autoComplete="email"
        />

        <FormField
          id="login-password"
          label="Contraseña"
          type="password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password}
          placeholder="Tu contraseña"
          autoComplete="current-password"
        />

        <Button type="submit" loading={submitting} fullWidth>
          {submitting ? 'Ingresando…' : 'Iniciar sesión'}
        </Button>
      </form>
    </AuthShell>
  );
}
