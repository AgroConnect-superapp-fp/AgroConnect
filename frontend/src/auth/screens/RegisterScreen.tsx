import { useState, type FormEvent } from 'react';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { useAuth } from '../context/useAuth';
import { ApiError } from '../api/authClient';
import {
  companySchema,
  credentialsSchema,
  transporterFormSchema,
  farmSchema,
  personalDataSchema,
  serverDetailsToFields,
  zodErrorsToFields,
  type FieldErrors,
} from '../schemas/authSchemas';
import { COMPANY_TYPES, VEHICLE_TYPES, type CompanyType } from '@agroconnect/contracts';
import { getRoleOption, type RoleName } from '../types';

interface RegisterScreenProps {
  role: RoleName;
  onBack: () => void;
  onGoToLogin: () => void;
}

const TOTAL_STEPS = 3;

export function RegisterScreen({
  role,
  onBack,
  onGoToLogin,
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
  const [company, setCompany] = useState<{
    razonSocial: string;
    nit: string;
    direccion: string;
    tipoEmpresa: CompanyType | '';
    departamento: string;
    municipio: string;
  }>({
    razonSocial: '',
    nit: '',
    direccion: '',
    tipoEmpresa: '',
    departamento: '',
    municipio: '',
  });
  const [transporter, setTransporter] = useState({
    tipoVehiculo: 'camion',
    placa: '',
    capacidadKg: '',
    cobertura: '',
    cadenaFrio: false,
    soatVence: '',
    licenciaVence: '',
  });
  const [credentials, setCredentials] = useState({
    password: '',
    confirmarPassword: '',
    aceptaTratamientoDatos: false,
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const requiresFarm = role === 'productor';
  const requiresCompany = role === 'comprador_b2b';
  const requiresTransporter = role === 'transportista';

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
      setCompany({
        ...parsed.data,
        direccion: parsed.data.direccion ?? '',
        tipoEmpresa: parsed.data.tipoEmpresa ?? '',
        departamento: parsed.data.departamento ?? '',
        municipio: parsed.data.municipio ?? '',
      });
    }

    if (requiresTransporter) {
      const parsed = transporterFormSchema.safeParse(transporter);
      if (!parsed.success) {
        setFieldErrors(
          Object.fromEntries(
            parsed.error.issues.map((issue) => [
              `transportista-${issue.path.join('.')}`,
              issue.message,
            ])
          )
        );
        return;
      }
      setTransporter(parsed.data);
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
              tipoEmpresa: company.tipoEmpresa || undefined,
              departamento: company.departamento || undefined,
              municipio: company.municipio || undefined,
            }
          : undefined,
        transportista: requiresTransporter
          ? {
              tipoVehiculo: transporter.tipoVehiculo as (typeof VEHICLE_TYPES)[number],
              placa: transporter.placa,
              capacidadKg: Number(transporter.capacidadKg),
              cobertura: transporter.cobertura
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean),
              cadenaFrio: transporter.cadenaFrio,
              soatVence: transporter.soatVence,
              licenciaVence: transporter.licenciaVence,
            }
          : undefined,
        aceptaTratamientoDatos: true,
      });
      setRegistered(true);
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

  if (registered) {
    return (
      <AuthShell title="Revisa tu correo" subtitle="Tu cuenta fue creada correctamente">
        <div
          data-testid="register-success"
          className="rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-900"
        >
          <p className="mb-2 font-semibold">Te enviamos un enlace de verificación.</p>
          <p>
            Abre el correo que enviamos a <strong>{personal.correo}</strong> y confirma tu
            cuenta. Por seguridad, no podrás iniciar sesión hasta verificarla.
          </p>
        </div>
        <div className="mt-5">
          <Button
            type="button"
            fullWidth
            data-testid="register-go-login"
            onClick={onGoToLogin}
          >
            Ir a iniciar sesión
          </Button>
        </div>
      </AuthShell>
    );
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
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-800">
                Tipo de empresa
                <select
                  id="register-empresa-tipo"
                  data-testid="register-empresa-tipo"
                  value={company.tipoEmpresa}
                  onChange={(event) =>
                    setCompany({
                      ...company,
                      tipoEmpresa: event.target.value as CompanyType | '',
                    })
                  }
                  className="min-h-12 rounded-lg border border-gray-300 px-3.5 py-2.5 text-base font-normal text-gray-900"
                >
                  <option value="">Selecciona una opción</option>
                  {COMPANY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.split('_').join(' ')}
                    </option>
                  ))}
                </select>
              </label>
              <FormField
                id="register-empresa-departamento"
                label="Departamento"
                value={company.departamento}
                onChange={(value) => setCompany({ ...company, departamento: value })}
                error={fieldErrors['empresa-departamento']}
                placeholder="Quindío"
              />
              <FormField
                id="register-empresa-municipio"
                label="Municipio"
                value={company.municipio}
                onChange={(value) => setCompany({ ...company, municipio: value })}
                error={fieldErrors['empresa-municipio']}
                placeholder="Armenia"
              />
            </>
          )}

          {requiresTransporter && (
            <>
              <p className="text-sm text-gray-600">
                Registra tu vehículo y cobertura para conectar con productores y
                compradores.
              </p>
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-800">
                Tipo de vehículo
                <select
                  id="register-transportista-vehiculo"
                  data-testid="register-transportista-vehiculo"
                  value={transporter.tipoVehiculo}
                  onChange={(event) =>
                    setTransporter({
                      ...transporter,
                      tipoVehiculo: event.target.value,
                    })
                  }
                  className="min-h-12 rounded-lg border border-gray-300 px-3.5 py-2.5 text-base font-normal text-gray-900"
                >
                  {VEHICLE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <FormField
                id="register-transportista-placa"
                label="Placa"
                value={transporter.placa}
                onChange={(value) => setTransporter({ ...transporter, placa: value })}
                error={fieldErrors['transportista-placa']}
                placeholder="ABC123"
                maxLength={6}
                help="Formato ABC123 o ABC12D"
              />
              <FormField
                id="register-transportista-capacidad"
                label="Capacidad (kg)"
                value={transporter.capacidadKg}
                onChange={(value) =>
                  setTransporter({ ...transporter, capacidadKg: value })
                }
                error={fieldErrors['transportista-capacidadKg']}
                inputMode="decimal"
                placeholder="3500"
              />
              <FormField
                id="register-transportista-cobertura"
                label="Cobertura"
                value={transporter.cobertura}
                onChange={(value) => setTransporter({ ...transporter, cobertura: value })}
                error={fieldErrors['transportista-cobertura']}
                placeholder="Armenia, Salento, Circasia"
                help="Separa los municipios con comas"
              />
              <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-3.5 py-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={transporter.cadenaFrio}
                  onChange={(event) =>
                    setTransporter({ ...transporter, cadenaFrio: event.target.checked })
                  }
                  className="h-5 w-5 accent-agro-green"
                />
                Tengo cadena de frío para productos perecederos
              </label>
              <FormField
                id="register-transportista-soat"
                label="Vencimiento del SOAT"
                type="date"
                value={transporter.soatVence}
                onChange={(value) => setTransporter({ ...transporter, soatVence: value })}
                error={fieldErrors['transportista-soatVence']}
              />
              <FormField
                id="register-transportista-licencia"
                label="Vencimiento de la licencia"
                type="date"
                value={transporter.licenciaVence}
                onChange={(value) =>
                  setTransporter({ ...transporter, licenciaVence: value })
                }
                error={fieldErrors['transportista-licenciaVence']}
              />
            </>
          )}

          {!requiresFarm && !requiresCompany && !requiresTransporter && (
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
