import { useEffect, useState } from 'react';
import type { Product } from '@agroconnect/contracts';
import { AuthShell } from '../components/AuthShell';
import { Button } from '../components/Button';
import { useAuth } from '../context/useAuth';
import { ApiError } from '../../services/apiClient';
import { fetchPendingProducts, moderateProduct } from '../../services/productsApi';
import { resolveImageUrl } from '../../services/cloudinary';

interface ModerationScreenProps {
  onBack: () => void;
}

export function ModerationScreen({ onBack }: ModerationScreenProps): React.ReactElement {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'administrador';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(isAdmin);
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    let active = true;
    fetchPendingProducts()
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(
          cause instanceof ApiError
            ? cause.message
            : 'No fue posible cargar los productos pendientes.'
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isAdmin]);

  async function handleModerate(
    product: Product,
    status: 'approved' | 'rejected'
  ): Promise<void> {
    setModeratingId(product.id);
    setError(null);
    setSuccess(null);
    try {
      await moderateProduct(product.id, status);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setSuccess(
        `"${product.name}" fue ${status === 'approved' ? 'aprobado' : 'rechazado'}.`
      );
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : 'No fue posible moderar el producto.'
      );
    } finally {
      setModeratingId(null);
    }
  }

  if (!isAdmin) {
    return (
      <AuthShell title="Moderación" subtitle="Acceso restringido">
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Solo un administrador puede moderar publicaciones.
        </p>
        <Button className="mt-4" fullWidth onClick={onBack}>
          Volver al panel
        </Button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Moderación de publicaciones"
      subtitle={`${products.length} pendiente${products.length === 1 ? '' : 's'} de revisión`}
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
      {error && (
        <div
          role="alert"
          data-testid="moderation-error"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          role="status"
          data-testid="moderation-success"
          className="mb-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
        >
          {success}
        </div>
      )}

      {loading && (
        <p className="text-center text-sm text-gray-600">Cargando pendientes…</p>
      )}

      {!loading && products.length === 0 && (
        <p
          data-testid="moderation-empty"
          className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          No hay publicaciones pendientes. La vitrina está al día.
        </p>
      )}

      {!loading && products.length > 0 && (
        <ul className="flex flex-col gap-4">
          {products.map((product) => {
            const image = product.images[0];
            const imageUrl = image ? resolveImageUrl(image.publicId, 'thumbnail') : null;

            return (
              <li
                key={product.id}
                data-testid={`moderation-item-${product.id}`}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex gap-4">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={image?.alt ?? product.name}
                      className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-2xl"
                    >
                      🌱
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-bold text-gray-900">
                      {product.name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {product.owner} · {product.municipality}, {product.department}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {product.crop} · {product.area} ha · productividad{' '}
                      {product.productivity}%
                      {product.createdAt
                        ? ` · ${new Date(product.createdAt).toLocaleDateString('es-CO')}`
                        : ''}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    data-testid={`moderation-approve-${product.id}`}
                    loading={moderatingId === product.id}
                    disabled={moderatingId !== null}
                    onClick={() => void handleModerate(product, 'approved')}
                  >
                    Aprobar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    data-testid={`moderation-reject-${product.id}`}
                    disabled={moderatingId !== null}
                    onClick={() => void handleModerate(product, 'rejected')}
                  >
                    Rechazar
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AuthShell>
  );
}
