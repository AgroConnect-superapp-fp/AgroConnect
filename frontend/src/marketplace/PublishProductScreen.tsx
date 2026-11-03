import { useState, type FormEvent } from 'react';
import { Button } from '../auth/components/Button';
import { FormField } from '../auth/components/FormField';
import { useAuth } from '../auth/context/useAuth';
import { useImageUpload } from '../hooks/useImageUpload';
import { resolveImageUrl } from '../services/cloudinary';
import { publishProduct } from '../services/productsApi';
import { ApiError } from '../services/apiClient';
import {
  CERTIFICATION_CATALOG,
  CROP_CATALOG,
  type CertificationType,
  type CropType,
  type Property,
} from '../types/property';

interface PublishProductScreenProps {
  onBack: () => void;
  onPublished: (product: Property) => void;
}

const CROP_OPTIONS = Object.entries(CROP_CATALOG) as [
  CropType,
  (typeof CROP_CATALOG)[CropType],
][];

const CERTIFICATION_OPTIONS = Object.entries(CERTIFICATION_CATALOG) as [
  CertificationType,
  (typeof CERTIFICATION_CATALOG)[CertificationType],
][];

export function PublishProductScreen({
  onBack,
  onPublished,
}: PublishProductScreenProps): React.ReactElement {
  const { usuario } = useAuth();
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [crop, setCrop] = useState<CropType>('coffee');
  const [area, setArea] = useState('');
  const [productivity, setProductivity] = useState('80');
  const [certification, setCertification] = useState<CertificationType | ''>('');
  const [lat, setLat] = useState('4.5339');
  const [lng, setLng] = useState('-75.6811');
  const [contact, setContact] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { uploadState, handleUpload, reset } = useImageUpload('agroconnect/products', [
    'marketplace',
  ]);

  if (!usuario) {
    return <div className="p-8 text-center text-gray-600">Cargando tu sesión…</div>;
  }

  if (usuario.rol !== 'productor' && usuario.rol !== 'administrador') {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-xl font-bold text-amber-950">Publicación restringida</h1>
          <p className="mt-2 text-sm text-amber-900">
            Solo las cuentas de productor pueden publicar cosechas. Tu rol actual es{' '}
            <strong>{usuario.rol}</strong>.
          </p>
          <Button variant="ghost" className="mt-4" onClick={onBack}>
            Volver al panel
          </Button>
        </div>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);

    const areaNumber = Number(area);
    const productivityNumber = Number(productivity);
    const latNumber = Number(lat);
    const lngNumber = Number(lng);

    if (
      name.trim().length < 3 ||
      department.trim().length < 2 ||
      municipality.trim().length < 2 ||
      !Number.isFinite(areaNumber) ||
      areaNumber <= 0 ||
      !Number.isFinite(productivityNumber) ||
      productivityNumber < 0 ||
      productivityNumber > 100 ||
      !Number.isFinite(latNumber) ||
      !Number.isFinite(lngNumber)
    ) {
      setError(
        'Revisa los campos obligatorios y los rangos de área, productividad y coordenadas.'
      );
      return;
    }

    if (uploadState.isUploading) {
      setError('Espera a que terminen de subir las imágenes.');
      return;
    }

    setSubmitting(true);
    try {
      const product = await publishProduct({
        name: name.trim(),
        department: department.trim(),
        municipality: municipality.trim(),
        crop,
        area: areaNumber,
        productivity: productivityNumber,
        certification: certification || undefined,
        lat: latNumber,
        lng: lngNumber,
        contact: contact.trim() || undefined,
        description: description.trim() || undefined,
        images: uploadState.uploadedImages,
        coordinates: [],
      });
      onPublished(product);
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'No fue posible publicar el producto. Intenta de nuevo.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50">
      <main className="mx-auto max-w-3xl px-4 py-8">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 min-h-12 rounded-lg px-2 text-sm font-semibold text-agro-green hover:bg-emerald-50"
        >
          ← Volver al panel
        </button>

        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold text-gray-900">Publicar una cosecha</h1>
          <p className="mt-1 text-sm text-gray-600">
            Los datos quedarán visibles en el marketplace. Las imágenes se suben a
            Cloudinary antes de publicar.
          </p>

          <form
            className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
            onSubmit={handleSubmit}
          >
            <div className="sm:col-span-2">
              <FormField
                id="publish-name"
                label="Nombre del producto o finca"
                value={name}
                onChange={setName}
                placeholder="Ej. Café de especialidad La Esperanza"
                maxLength={160}
              />
            </div>

            <FormField
              id="publish-department"
              label="Departamento"
              value={department}
              onChange={setDepartment}
              placeholder="Quindío"
              maxLength={120}
            />
            <FormField
              id="publish-municipality"
              label="Municipio"
              value={municipality}
              onChange={setMunicipality}
              placeholder="Salento"
              maxLength={120}
            />

            <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-800">
              Cultivo
              <select
                id="publish-crop"
                data-testid="publish-crop"
                value={crop}
                onChange={(event) => setCrop(event.target.value as CropType)}
                className="min-h-12 rounded-lg border border-gray-300 px-3.5 py-2.5 text-base font-normal text-gray-900"
              >
                {CROP_OPTIONS.map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.emoji} {info.displayName}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-semibold text-gray-800">
              Certificación
              <select
                id="publish-certification"
                data-testid="publish-certification"
                value={certification}
                onChange={(event) =>
                  setCertification(event.target.value as CertificationType | '')
                }
                className="min-h-12 rounded-lg border border-gray-300 px-3.5 py-2.5 text-base font-normal text-gray-900"
              >
                <option value="">Sin certificación</option>
                {CERTIFICATION_OPTIONS.map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.emoji} {info.displayName}
                  </option>
                ))}
              </select>
            </label>

            <FormField
              id="publish-area"
              label="Área (hectáreas)"
              value={area}
              onChange={setArea}
              inputMode="decimal"
              placeholder="12.5"
            />
            <FormField
              id="publish-productivity"
              label="Productividad (%)"
              value={productivity}
              onChange={setProductivity}
              inputMode="decimal"
              placeholder="80"
            />
            <FormField
              id="publish-lat"
              label="Latitud"
              value={lat}
              onChange={setLat}
              inputMode="decimal"
            />
            <FormField
              id="publish-lng"
              label="Longitud"
              value={lng}
              onChange={setLng}
              inputMode="decimal"
            />
            <FormField
              id="publish-contact"
              label="Contacto"
              value={contact}
              onChange={setContact}
              placeholder="+57 300 000 00 00"
              maxLength={60}
            />

            <div className="sm:col-span-2">
              <label
                htmlFor="publish-description"
                className="text-sm font-semibold text-gray-800"
              >
                Descripción
              </label>
              <textarea
                id="publish-description"
                data-testid="publish-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={2000}
                rows={4}
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-base text-gray-900 outline-none focus:border-agro-green focus:ring-2 focus:ring-agro-green/25"
              />
            </div>

            <div className="sm:col-span-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 p-4">
              <label
                htmlFor="publish-images"
                className="text-sm font-semibold text-gray-800"
              >
                Imágenes (máximo 6)
              </label>
              <input
                id="publish-images"
                data-testid="publish-images"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                className="mt-2 block w-full text-sm text-gray-700"
                onChange={(event) => {
                  if (event.target.files && event.target.files.length > 0) {
                    void handleUpload(event.target.files);
                  }
                }}
              />
              {uploadState.isUploading && (
                <p className="mt-2 text-sm text-emerald-800">
                  Subiendo imágenes… {uploadState.progress}%
                </p>
              )}
              {uploadState.error && (
                <p role="alert" className="mt-2 text-sm font-medium text-red-600">
                  {uploadState.error}
                </p>
              )}
              {uploadState.uploadedImages.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {uploadState.uploadedImages.map((image) => (
                    <img
                      key={image.publicId}
                      src={image.url ?? resolveImageUrl(image.publicId, 'thumbnail')}
                      alt={image.alt ?? 'Imagen del producto'}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={reset}
                    className="min-h-20 rounded-lg border border-gray-300 px-3 text-xs font-semibold text-gray-600 hover:bg-white"
                  >
                    Quitar imágenes
                  </button>
                </div>
              )}
            </div>

            {error && (
              <p
                role="alert"
                data-testid="publish-error"
                className="sm:col-span-2 text-sm font-medium text-red-600"
              >
                {error}
              </p>
            )}

            <div className="sm:col-span-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onBack}>
                Cancelar
              </Button>
              <Button
                type="submit"
                data-testid="publish-submit"
                loading={submitting}
                disabled={uploadState.isUploading}
              >
                Publicar producto
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
