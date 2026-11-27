import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/**
 * Estado de error recuperable.
 *
 * Usa `role="alert"` porque aparece tras una acción del usuario y debe
 * anunciarse; el botón de reintento es opcional (errores sin retry posible).
 */
export function ErrorState({
  title = 'No pudimos cargar la información',
  description = 'Revisa tu conexión e intenta de nuevo.',
  onRetry,
  retryLabel = 'Reintentar',
}: ErrorStateProps): React.ReactElement {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-6 py-8 text-center"
    >
      <h2 className="text-lg font-semibold text-red-900">{title}</h2>
      <p className="max-w-prose text-sm text-red-800">{description}</p>
      {onRetry && (
        <Button variant="danger" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
