import { useState, type FormEvent } from 'react';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { ApiError, authApi } from '../api/authClient';
import {
  resetPasswordSchema,
  zodErrorsToFields,
  type FieldErrors,
} from '../schemas/authSchemas';

interface ResetPasswordScreenProps {
  token: string;
  onSuccess: () => void;
  onRequestNewLink: () => void;
}

export function ResetPasswordScreen({
  token,
  onSuccess,
  onRequestNewLink,
}: ResetPasswordScreenProps): React.ReactElement {
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setGeneralError(null);

    const parsed = resetPasswordSchema.safeParse({ password, confirmarPassword });
    if (!parsed.success) {
      setFieldErrors(zodErrorsToFields(parsed.error));
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      await authApi.resetPassword(token, parsed.data.password);
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'TOKEN_INVALID') {
        setGeneralError(
          'El enlace de recuperación es inválido o expiró. Solicita uno nuevo para continuar.'
        );
      } else if (error instanceof ApiError && error.code === 'RATE_LIMITED') {
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
      title="Crea tu nueva contraseña"
      subtitle="Elige una contraseña segura con al menos 8 caracteres, letras y números."
    >
      {done ? (
        <div className="flex flex-col gap-4">
          <div
            role="status"
            data-testid="reset-success"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          >
            Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión con
            ella.
          </div>
          <Button type="button" fullWidth onClick={onSuccess}>
            Ir a iniciar sesión
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
              data-testid="reset-error"
              className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              <span>{generalError}</span>
              {generalError.includes('expiró') && (
                <button
                  type="button"
                  onClick={onRequestNewLink}
                  className="self-start font-semibold text-agro-green underline underline-offset-4"
                >
                  Solicitar un enlace nuevo
                </button>
              )}
            </div>
          )}

          <FormField
            id="reset-password"
            label="Nueva contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            error={fieldErrors.password}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
          />

          <FormField
            id="reset-confirmar"
            label="Confirma tu nueva contraseña"
            type="password"
            value={confirmarPassword}
            onChange={setConfirmarPassword}
            error={fieldErrors.confirmarPassword}
            placeholder="Repite la contraseña"
            autoComplete="new-password"
          />

          <Button type="submit" loading={submitting} fullWidth>
            {submitting ? 'Actualizando…' : 'Actualizar contraseña'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
