interface PaginationProps {
  /** Página actual, base 1. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  label?: string;
}

/**
 * Paginación accesible con navegación por botones de 48 px.
 *
 * No usa solo flechas: cada control tiene nombre accesible y el rango se
 * anuncia en texto (`Página X de Y`). Con `total` 0 no renderiza nada.
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  label = 'Paginación',
}: PaginationProps): React.ReactElement | null {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(page, 1), totalPages);

  if (total === 0) return null;

  return (
    <nav aria-label={label} className="flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={() => onPageChange(current - 1)}
        disabled={current <= 1}
        className="inline-flex min-h-12 items-center rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-agro-green/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Anterior
      </button>
      <p className="text-sm text-gray-600" aria-live="polite">
        Página {current} de {totalPages}
      </p>
      <button
        type="button"
        onClick={() => onPageChange(current + 1)}
        disabled={current >= totalPages}
        className="inline-flex min-h-12 items-center rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-agro-green/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Siguiente
      </button>
    </nav>
  );
}
