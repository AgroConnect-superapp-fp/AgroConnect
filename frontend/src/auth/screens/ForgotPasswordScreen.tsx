import { useState, type FormEvent } from 'react';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { ApiError, authApi } from '../api/authClient';
import {
  forgotPasswordSchema,
  zodErrorsToFields,
  type FieldErrors,
} from '../schemas/authSchemas';

interface ForgotPasswordScreenProps {
  onBack: () => void;
}

export function ForgotPasswordScreen({
  onBack,
}: ForgotPasswordScreenProps): React.ReactElement {
  const [correo, setCorreo] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setGeneralError(null);

    const parsed = forgotPasswordSchema.safeParse({ correo });
    if (!parsed.success) {
      setFieldErrors(zodErrorsToFields(parsed.error));
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      await authApi.forgotPassword(parsed.data.correo);
      setSent(true);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'RATE_LIMITED') {
        setGeneralError('Demasiados intentos. Espera unos minutos e intenta de nuevo.');
      } else {
        setGeneralError('Ocurrió un error inesperado. Intenta de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Recupera tu contraseña"
      subtitle="Te enviaremos un enlace para restablecer el acceso a tu cuenta."
      footer={
        <button
          type="button"
          onClick={onBack}
          className="min-h-12 text-gray-500 underline-offset-4 hover:underline"
        >
          Volver al inicio de sesión
        </button>
      }
    >
      {sent ? (
        <div className="flex flex-col gap-4">
          <div
            role="status"
            data-testid="forgot-success"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          >
            Si el correo está registrado, recibirás instrucciones para restablecer tu
            contraseña. Revisa tu bandeja de entrada y la carpeta de spam.
          </div>
          <Button type="button" variant="secondary" fullWidth onClick={onBack}>
            Volver al inicio de sesión
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
          className="flex flex-col gap-4"
        >
          {generalError && (
            <div
              role="alert"
              data-testid="forgot-error"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {generalError}
            </div>
          )}

          <FormField
            id="forgot-correo"
            label="Correo electrónico"
            type="email"
            value={correo}
            onChange={setCorreo}
            error={fieldErrors.correo}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
          />

          <Button type="submit" loading={submitting} fullWidth>
            {submitting ? 'Enviando…' : 'Enviar enlace de recuperación'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
