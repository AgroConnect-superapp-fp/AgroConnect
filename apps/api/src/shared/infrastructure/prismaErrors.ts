interface PrismaKnownError {
  code: string;
  meta?: unknown;
  message: string;
}

function isPrismaKnownError(error: unknown): error is PrismaKnownError {
  return (
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
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

const DATABASE_UNAVAILABLE_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2021', 'P2022']);

/**
 * Detecta errores de infraestructura de base de datos que deben responder 503
 * (servicio temporalmente no disponible), no 500.
 */
export function isDatabaseUnavailable(error: unknown): boolean {
  if (isPrismaKnownError(error) && DATABASE_UNAVAILABLE_CODES.has(error.code)) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return /can't reach database server|connection terminated|econnrefused|enotfound|etimedout/i.test(
    message,
  );
}
