import { useEffect, useState, type FormEvent } from 'react';
import {
  COMPANY_TYPES,
  VEHICLE_TYPES,
  type CompanyType,
  type VehicleType,
} from '@agroconnect/contracts';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/Button';
import { FormField } from '../components/FormField';
import { useAuth } from '../context/useAuth';
import { ROLE_LABELS } from '../types';
import {
  getMyProfile,
  updateMyProfile,
  type MyProfile,
  type ProfileUpdatePayload,
} from '../../services/profileApi';
import { ApiError } from '../../services/apiClient';

interface ProfileScreenProps {
  onBack: () => void;
}

export function ProfileScreen({ onBack }: ProfileScreenProps): React.ReactElement {
  const { usuario } = useAuth();
  const isDemo = usuario?.id === 'demo-visitante';
  const role = usuario?.rol ?? 'comprador_b2c';
  const canEdit =
    role === 'productor' || role === 'comprador_b2b' || role === 'transportista';
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(!isDemo);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(
    isDemo ? 'El perfil no está disponible en la sesión de demostración.' : null
  );
  const [success, setSuccess] = useState<string | null>(null);

  const [producer, setProducer] = useState({ nombre: '', municipio: '', vereda: '' });
  const [company, setCompany] = useState({
    razonSocial: '',
    direccion: '',
    tipoEmpresa: '' as CompanyType | '',
    departamento: '',
    municipio: '',
  });
  const [transporter, setTransporter] = useState({
    tipoVehiculo: 'camion' as VehicleType,
    placa: '',
    capacidadKg: '',
    cobertura: '',
    cadenaFrio: false,
    soatVence: '',
    licenciaVence: '',
  });

  useEffect(() => {
    if (isDemo) return;

    let active = true;
    getMyProfile()
      .then((data) => {
        if (!active) return;
        setProfile(data);
        if (data.productor) {
          setProducer({
            nombre: data.productor.nombre,
            municipio: data.productor.municipio,
            vereda: data.productor.vereda,
          });
        }
        if (data.empresa) {
          setCompany({
            razonSocial: data.empresa.razonSocial,
            direccion: data.empresa.direccion ?? '',
            tipoEmpresa: data.empresa.tipoEmpresa ?? '',
            departamento: data.empresa.departamento ?? '',
            municipio: data.empresa.municipio ?? '',
          });
        }
        if (data.transportista) {
          setTransporter({
            tipoVehiculo: data.transportista.tipoVehiculo,
            placa: data.transportista.placa,
            capacidadKg: String(data.transportista.capacidadKg),
            cobertura: data.transportista.cobertura.join(', '),
            cadenaFrio: data.transportista.cadenaFrio,
            soatVence: data.transportista.soatVence,
            licenciaVence: data.transportista.licenciaVence,
          });
        }
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(
          cause instanceof ApiError ? cause.message : 'No fue posible cargar tu perfil.'
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isDemo]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (saving || !canEdit) return;

    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      let payload: ProfileUpdatePayload;

      if (role === 'productor') {
        payload = {
          productor: {
            nombre: producer.nombre.trim(),
            municipio: producer.municipio.trim(),
            vereda: producer.vereda.trim(),
          },
        };
      } else if (role === 'comprador_b2b') {
        payload = {
          empresa: {
            razonSocial: company.razonSocial.trim(),
            direccion: company.direccion.trim() || undefined,
            tipoEmpresa: company.tipoEmpresa || undefined,
            departamento: company.departamento.trim() || undefined,
            municipio: company.municipio.trim() || undefined,
          },
        };
      } else {
        payload = {
          transportista: {
            tipoVehiculo: transporter.tipoVehiculo,
            placa: transporter.placa.trim().toUpperCase(),
            capacidadKg: Number(transporter.capacidadKg),
            cobertura: transporter.cobertura
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean),
            cadenaFrio: transporter.cadenaFrio,
            soatVence: transporter.soatVence,
            licenciaVence: transporter.licenciaVence,
          },
        };
      }

      const updated = await updateMyProfile(payload);
      setProfile(updated);
      setSuccess('Perfil actualizado correctamente.');
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : 'No fue posible guardar los cambios.'
      );
    } finally {
      setSaving(false);
    }
  }

  const subtitle = profile
    ? `${profile.usuario.nombre} · ${ROLE_LABELS[profile.usuario.rol]}`
    : usuario
      ? `${usuario.nombre} · ${ROLE_LABELS[usuario.rol]}`
      : undefined;

  return (
    <AuthShell
      title="Mi perfil"
      subtitle={subtitle}
      footer={
        <button
          type="button"
          onClick={onBack}
          className="min-h-12 font-semibold text-agro-green underline-offset-4 hover:underline"
        >
          ← Volver al panel
        </button>
      }
    >
      {loading && (
        <p className="text-center text-sm text-gray-600">Cargando tu perfil…</p>
      )}

      {!loading && error && (
        <div
          role="alert"
          data-testid="profile-error"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {!loading && success && (
        <div
          role="status"
          data-testid="profile-success"
          className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
        >
          {success}
        </div>
      )}

      {!loading && profile && (
        <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          <p>
            <span className="font-semibold">Correo:</span> {profile.usuario.correo}
          </p>
          <p className="mt-1">
            <span className="font-semibold">Estado:</span> {profile.usuario.estado}
            {profile.usuario.verificado
              ? ' · Correo verificado'
              : ' · Correo sin verificar'}
          </p>
          {profile.empresa && (
            <p className="mt-1">
              <span className="font-semibold">NIT:</span> {profile.empresa.nit}
            </p>
          )}
        </div>
      )}

      {!loading && !canEdit && (
        <p className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          Tu rol no tiene un perfil editable en esta versión. Puedes seguir usando el
          marketplace con tu cuenta.
        </p>
      )}

      {!loading && canEdit && (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="flex flex-col gap-4"
        >
          {role === 'productor' && (
            <>
              <FormField
                id="profile-productor-nombre"
                label="Nombre de la finca"
                value={producer.nombre}
                onChange={(value) => setProducer({ ...producer, nombre: value })}
                placeholder="El Mirador"
              />
              <FormField
                id="profile-productor-municipio"
                label="Municipio"
                value={producer.municipio}
                onChange={(value) => setProducer({ ...producer, municipio: value })}
                placeholder="Salento"
              />
              <FormField
                id="profile-productor-vereda"
                label="Vereda"
                value={producer.vereda}
                onChange={(value) => setProducer({ ...producer, vereda: value })}
                placeholder="Boquía"
              />
            </>
          )}

          {role === 'comprador_b2b' && (
            <>
              <FormField
                id="profile-empresa-razon"
                label="Razón social"
                value={company.razonSocial}
                onChange={(value) => setCompany({ ...company, razonSocial: value })}
                placeholder="Frutas del Quindío S.A.S."
              />
              <FormField
                id="profile-empresa-direccion"
                label="Dirección (opcional)"
                value={company.direccion}
                onChange={(value) => setCompany({ ...company, direccion: value })}
                placeholder="Calle 12 # 4-56, Armenia"
              />
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-800">
                Tipo de empresa
                <select
                  id="profile-empresa-tipo"
                  data-testid="profile-empresa-tipo"
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
                      {type.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <FormField
                id="profile-empresa-departamento"
                label="Departamento"
                value={company.departamento}
                onChange={(value) => setCompany({ ...company, departamento: value })}
                placeholder="Quindío"
              />
              <FormField
                id="profile-empresa-municipio"
                label="Municipio"
                value={company.municipio}
                onChange={(value) => setCompany({ ...company, municipio: value })}
                placeholder="Armenia"
              />
            </>
          )}

          {role === 'transportista' && (
            <>
              <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-800">
                Tipo de vehículo
                <select
                  id="profile-transportista-vehiculo"
                  data-testid="profile-transportista-vehiculo"
                  value={transporter.tipoVehiculo}
                  onChange={(event) =>
                    setTransporter({
                      ...transporter,
                      tipoVehiculo: event.target.value as VehicleType,
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
                id="profile-transportista-placa"
                label="Placa"
                value={transporter.placa}
                onChange={(value) => setTransporter({ ...transporter, placa: value })}
                placeholder="ABC123"
                maxLength={6}
              />
              <FormField
                id="profile-transportista-capacidad"
                label="Capacidad (kg)"
                type="number"
                value={transporter.capacidadKg}
                onChange={(value) =>
                  setTransporter({ ...transporter, capacidadKg: value })
                }
                inputMode="numeric"
                placeholder="3500"
              />
              <FormField
                id="profile-transportista-cobertura"
                label="Cobertura"
                value={transporter.cobertura}
                onChange={(value) => setTransporter({ ...transporter, cobertura: value })}
                help="Separa los municipios con coma"
                placeholder="Armenia, Salento"
              />
              <label className="flex min-h-12 items-center gap-3 text-sm font-semibold text-gray-800">
                <input
                  type="checkbox"
                  checked={transporter.cadenaFrio}
                  onChange={(event) =>
                    setTransporter({ ...transporter, cadenaFrio: event.target.checked })
                  }
                  className="h-5 w-5 rounded border-gray-300 text-agro-green focus:ring-agro-green"
                />
                Ofrezco cadena de frío
              </label>
              <FormField
                id="profile-transportista-soat"
                label="Vigencia del SOAT"
                type="date"
                value={transporter.soatVence}
                onChange={(value) => setTransporter({ ...transporter, soatVence: value })}
              />
              <FormField
                id="profile-transportista-licencia"
                label="Vigencia de la licencia"
                type="date"
                value={transporter.licenciaVence}
                onChange={(value) =>
                  setTransporter({ ...transporter, licenciaVence: value })
                }
              />
            </>
          )}

          <Button type="submit" fullWidth loading={saving} data-testid="profile-save">
            Guardar cambios
          </Button>
        </form>
      )}

      {!loading && !profile && !error && (
        <p className="text-center text-sm text-gray-600">
          No hay datos de perfil disponibles.
        </p>
      )}
    </AuthShell>
  );
}
