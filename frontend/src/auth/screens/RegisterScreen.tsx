import { useState, type FormEvent } from 'react';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { useAuth } from '../context/useAuth';
import { ApiError } from '../api/authClient';
import {
  companySchema,
  credentialsSchema,
  farmSchema,
  personalDataSchema,
  serverDetailsToFields,
  zodErrorsToFields,
  type FieldErrors,
} from '../schemas/authSchemas';
import { getRoleOption, type RoleName } from '../types';

interface RegisterScreenProps {
  role: RoleName;
  onBack: () => void;
  onGoToLogin: () => void;
  onSuccess: () => void;
}

const TOTAL_STEPS = 3;

export function RegisterScreen({
  role,
  onBack,
  onGoToLogin,
  onSuccess,
}: RegisterScreenProps): React.ReactElement {
  const { register } = useAuth();
  const roleOption = getRoleOption(role);

  const [step, setStep] = useState(1);
  const [personal, setPersonal] = useState({
    nombre: '',
    documento: '',
    correo: '',
    celular: '',
  });
  const [farm, setFarm] = useState({ nombre: '', municipio: '', vereda: '' });
  const [company, setCompany] = useState({ razonSocial: '', nit: '', direccion: '' });
  const [credentials, setCredentials] = useState({
    password: '',
    confirmarPassword: '',
    aceptaTratamientoDatos: false,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const requiresFarm = role === 'productor';
  const requiresCompany = role === 'comprador_b2b';

  function normalizeErrors(errors: FieldErrors): FieldErrors {
    return Object.fromEntries(
      Object.entries(errors).map(([key, message]) => [key.replace(/\./g, '-'), message])
    );
  }

  function handleNextFromPersonal(): void {
    setGeneralError(null);
    const parsed = personalDataSchema.safeParse(personal);

    if (!parsed.success) {
      setFieldErrors(zodErrorsToFields(parsed.error));
      return;
    }

    setFieldErrors({});
    setPersonal(parsed.data);
    setStep(2);
  }

  function handleNextFromProfile(): void {
    setGeneralError(null);

    if (requiresFarm) {
      const parsed = farmSchema.safeParse(farm);
      if (!parsed.success) {
        setFieldErrors(zodErrorsToFields(parsed.error));
        return;
      }
      setFarm(parsed.data);
    }

    if (requiresCompany) {
      const parsed = companySchema.safeParse(company);
      if (!parsed.success) {
        setFieldErrors(zodErrorsToFields(parsed.error));
        return;
      }
      setCompany({ ...parsed.data, direccion: parsed.data.direccion ?? '' });
    }

    setFieldErrors({});
    setStep(3);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setGeneralError(null);
    const parsed = credentialsSchema.safeParse(credentials);

    if (!parsed.success) {
      setFieldErrors(zodErrorsToFields(parsed.error));
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      await register({
        nombre: personal.nombre,
        documento: personal.documento,
        correo: personal.correo,
        celular: personal.celular,
        password: parsed.data.password,
        rol: role,
        finca: requiresFarm
          ? { nombre: farm.nombre, municipio: farm.municipio, vereda: farm.vereda }
          : undefined,
        empresa: requiresCompany
          ? {
              razonSocial: company.razonSocial,
              nit: company.nit,
              direccion: company.direccion || undefined,
            }
          : undefined,
        aceptaTratamientoDatos: true,
      });
      onSuccess();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'EMAIL_ALREADY_EXISTS') {
          setFieldErrors({ correo: error.message });
          setStep(1);
        } else if (error.code === 'DOCUMENT_ALREADY_EXISTS') {
          setFieldErrors({ documento: error.message });
          setStep(1);
        } else if (error.code === 'PHONE_ALREADY_EXISTS') {
          setFieldErrors({ celular: error.message });
          setStep(1);
        } else if (error.code === 'VALIDATION_ERROR' && error.details) {
          setFieldErrors(normalizeErrors(serverDetailsToFields(error.details)));
          setGeneralError('Revisa los campos marcados e intenta de nuevo.');
        } else if (error.code === 'RATE_LIMITED') {
          setGeneralError('Demasiados intentos. Espera unos minutos e intenta de nuevo.');
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
      title="Crea tu cuenta"
      subtitle={`Perfil: ${roleOption.titulo} · Paso ${step} de ${TOTAL_STEPS}`}
      footer={
        <div className="flex flex-col items-center gap-2">
          <span>
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={onGoToLogin}
              className="min-h-12 font-semibold text-agro-green underline-offset-4 hover:underline"
            >
              Iniciar sesión
            </button>
          </span>
          <button
            type="button"
            onClick={step === 1 ? onBack : () => setStep(step - 1)}
            className="min-h-12 text-gray-500 underline-offset-4 hover:underline"
          >
            {step === 1 ? 'Cambiar de perfil' : 'Volver al paso anterior'}
          </button>
        </div>
      }
    >
      <div className="mb-5 flex gap-1.5" aria-hidden="true">
        {Array.from({ length: TOTAL_STEPS }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index < step ? 'bg-agro-green' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {generalError && (
        <div
          role="alert"
          data-testid="register-error"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {generalError}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <FormField
            id="register-nombre"
            label="Nombre completo"
            value={personal.nombre}
            onChange={(value) => setPersonal({ ...personal, nombre: value })}
            error={fieldErrors.nombre}
            placeholder="María Fernanda López"
            autoComplete="name"
          />
          <FormField
            id="register-documento"
            label="Documento de identidad"
            value={personal.documento}
            onChange={(value) => setPersonal({ ...personal, documento: value })}
            error={fieldErrors.documento}
            placeholder="1098765432"
            inputMode="numeric"
            maxLength={12}
            help="Solo dígitos, entre 6 y 12 caracteres"
          />
          <FormField
            id="register-correo"
            label="Correo electrónico"
            type="email"
            value={personal.correo}
            onChange={(value) => setPersonal({ ...personal, correo: value })}
            error={fieldErrors.correo}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
          />
          <FormField
            id="register-celular"
            label="Celular"
            value={personal.celular}
            onChange={(value) => setPersonal({ ...personal, celular: value })}
            error={fieldErrors.celular}
            placeholder="3105557788"
            inputMode="tel"
            maxLength={10}
            help="10 dígitos, comienza por 3"
          />
          <Button
            type="button"
            data-testid="register-next-1"
            onClick={handleNextFromPersonal}
            fullWidth
          >
            Continuar
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          {requiresFarm && (
            <>
              <p className="text-sm text-gray-600">
                Cuéntanos de tu finca para que los compradores puedan encontrarte.
              </p>
              <FormField
                id="register-finca-nombre"
                label="Nombre de la finca"
                value={farm.nombre}
                onChange={(value) => setFarm({ ...farm, nombre: value })}
                error={fieldErrors['finca-nombre']}
                placeholder="El Mirador"
              />
              <FormField
                id="register-finca-municipio"
                label="Municipio"
                value={farm.municipio}
                onChange={(value) => setFarm({ ...farm, municipio: value })}
                error={fieldErrors['finca-municipio']}
                placeholder="Salento"
              />
              <FormField
                id="register-finca-vereda"
                label="Vereda"
                value={farm.vereda}
                onChange={(value) => setFarm({ ...farm, vereda: value })}
                error={fieldErrors['finca-vereda']}
                placeholder="Boquía"
              />
            </>
          )}

          {requiresCompany && (
            <>
              <p className="text-sm text-gray-600">
                Cuéntanos de tu empresa para agilizar tus compras al por mayor.
              </p>
              <FormField
                id="register-empresa-razon"
                label="Razón social"
                value={company.razonSocial}
                onChange={(value) => setCompany({ ...company, razonSocial: value })}
                error={fieldErrors['empresa-razonSocial']}
                placeholder="Frutas del Quindío S.A.S."
              />
              <FormField
                id="register-empresa-nit"
                label="NIT"
                value={company.nit}
                onChange={(value) => setCompany({ ...company, nit: value })}
                error={fieldErrors['empresa-nit']}
                placeholder="901234567-8"
                help="9 o 10 dígitos, con guion y dígito de verificación opcional"
              />
              <FormField
                id="register-empresa-direccion"
                label="Dirección (opcional)"
                value={company.direccion}
                onChange={(value) => setCompany({ ...company, direccion: value })}
                error={fieldErrors['empresa-direccion']}
                placeholder="Calle 12 # 4-56, Armenia"
              />
            </>
          )}

          {!requiresFarm && !requiresCompany && (
            <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              El perfil <strong>{roleOption.titulo}</strong> no requiere datos
              adicionales. Continúa para crear tu contraseña.
            </p>
          )}

          <Button
            type="button"
            data-testid="register-next-2"
            onClick={handleNextFromProfile}
            fullWidth
          >
            Continuar
          </Button>
        </div>
      )}

      {step === 3 && (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
          className="flex flex-col gap-4"
        >
          <FormField
            id="register-password"
            label="Contraseña"
            type="password"
            value={credentials.password}
            onChange={(value) => setCredentials({ ...credentials, password: value })}
            error={fieldErrors.password}
            autoComplete="new-password"
            help="Mínimo 8 caracteres, con letras y números"
          />
          <FormField
            id="register-confirmar"
            label="Confirmar contraseña"
            type="password"
            value={credentials.confirmarPassword}
            onChange={(value) =>
              setCredentials({ ...credentials, confirmarPassword: value })
            }
            error={fieldErrors.confirmarPassword}
            autoComplete="new-password"
          />

          <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-gray-200 px-3.5 py-3">
            <input
              id="register-acepta"
              data-testid="register-acepta"
              type="checkbox"
              checked={credentials.aceptaTratamientoDatos}
              onChange={(event) =>
                setCredentials({
                  ...credentials,
                  aceptaTratamientoDatos: event.target.checked,
                })
              }
              className="mt-0.5 h-5 w-5 accent-agro-green"
            />
            <span className="text-sm text-gray-700">
              Autorizo el tratamiento de mis datos personales conforme a la Ley 1581 de
              2012.
            </span>
          </label>
          {fieldErrors.aceptaTratamientoDatos && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {fieldErrors.aceptaTratamientoDatos}
            </p>
          )}

          <Button
            type="submit"
            data-testid="register-submit"
            loading={submitting}
            fullWidth
          >
            {submitting ? 'Creando tu cuenta…' : 'GUARDAR'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
