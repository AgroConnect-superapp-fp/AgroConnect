interface PrismaKnownError {
  code: string;
  meta?: unknown;
  message: string;
}

function isPrismaKnownError(error: unknown): error is PrismaKnownError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  );
}

/**
 * Devuelve el texto que identifica la restricción única violada (P2002), o `null` si el error
 * no es una violación de unicidad. Con driver adapters el detalle puede venir en `meta.target`
 * o en `meta.driverAdapterError`, así que se inspecciona el `meta` completo y el mensaje.
 */
export function uniqueViolationTarget(error: unknown): string | null {
  if (!isPrismaKnownError(error) || error.code !== 'P2002') {
    return null;
  }
  return `${JSON.stringify(error.meta ?? {})} ${error.message}`.toLowerCase();
}
