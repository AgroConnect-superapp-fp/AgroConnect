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

interface VerifyEmailScreenProps {
  token: string;
  onSuccess: () => void;
  onRequestNewLink: () => void;
}

export function VerifyEmailScreen({
  token,
  onSuccess,
  onRequestNewLink,
}: VerifyEmailScreenProps): React.ReactElement {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>(
    'idle'
  );
  const [correo, setCorreo] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify(): Promise<void> {
    if (status === 'verifying') {
      return;
    }

    setStatus('verifying');

    try {
      await authApi.verifyEmail(token);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  async function handleResend(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (resending) {
      return;
    }

    const parsed = forgotPasswordSchema.safeParse({ correo });
    if (!parsed.success) {
      setFieldErrors(zodErrorsToFields(parsed.error));
      return;
    }

    setFieldErrors({});
    setResending(true);

    try {
      await authApi.resendVerification(parsed.data.correo);
      setResent(true);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'RATE_LIMITED') {
        setFieldErrors({
          correo: 'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
        });
      } else {
        setFieldErrors({ correo: 'Ocurrió un error inesperado. Intenta de nuevo.' });
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell
      title="Verifica tu correo"
      subtitle="Confirma tu cuenta para activar todas las funciones de AgroConnect."
      footer={
        <button
          type="button"
          onClick={onRequestNewLink}
          className="min-h-12 text-gray-500 underline-offset-4 hover:underline"
        >
          Volver al inicio de sesión
        </button>
      }
    >
      {status === 'success' ? (
        <div className="flex flex-col gap-4">
          <div
            role="status"
            data-testid="verify-success"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          >
            Tu correo fue verificado correctamente. Ya puedes disfrutar de todas las
            funciones.
          </div>
          <Button type="button" fullWidth onClick={onSuccess}>
            Ir a iniciar sesión
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {status === 'error' && (
            <div
              role="alert"
              data-testid="verify-error"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              El enlace de verificación es inválido o expiró. Puedes solicitar uno nuevo.
            </div>
          )}

          {status !== 'error' && (
            <Button
              type="button"
              loading={status === 'verifying'}
              fullWidth
              onClick={() => void handleVerify()}
            >
              {status === 'verifying' ? 'Verificando…' : 'Confirmar verificación'}
            </Button>
          )}

          {status === 'error' && (
            <form
              onSubmit={(event) => void handleResend(event)}
              noValidate
              className="flex flex-col gap-3"
            >
              {resent ? (
                <div
                  role="status"
                  data-testid="verify-resent"
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
                >
                  Si el correo está registrado y sin verificar, recibirás un nuevo enlace.
                </div>
              ) : (
                <>
                  <FormField
                    id="verify-correo"
                    label="Correo electrónico"
                    type="email"
                    value={correo}
                    onChange={setCorreo}
                    error={fieldErrors.correo}
                    placeholder="tucorreo@ejemplo.com"
                    autoComplete="email"
                  />
                  <Button type="submit" variant="secondary" loading={resending} fullWidth>
                    {resending ? 'Enviando…' : 'Reenviar enlace de verificación'}
                  </Button>
                </>
              )}
            </form>
          )}
        </div>
      )}
    </AuthShell>
  );
}
