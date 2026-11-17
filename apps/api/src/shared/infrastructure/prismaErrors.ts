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

/** Detecta P2025 (registro no encontrado durante update/delete). */
export function isPrismaNotFound(error: unknown): boolean {
  return isPrismaKnownError(error) && error.code === 'P2025';
}

/** SQLSTATE de PostgreSQL para la violación de una restricción CHECK. */
const CHECK_VIOLATION_SQLSTATE = '23514';

/**
 * Lee el SQLSTATE del `meta` de un error de Prisma.
 *
 * Con driver adapters, el error de Postgres viaja en `meta.code` (p. ej.
 * `23514` para un CHECK violado) y el detalle en `meta.message`.
 */
function readMetaCode(meta: unknown): string | null {
  if (typeof meta !== 'object' || meta === null) {
    return null;
  }

  const record = meta as Record<string, unknown>;
  const code = record['code'];
  return typeof code === 'string' ? code : null;
}

/**
 * Detecta la violación de un CHECK de PostgreSQL (SQLSTATE 23514).
 *
 * Es el caso de una geometría inválida (polígono auto-intersectado o
 * degenerado): el error debe traducirse a un 422 de dominio, nunca a un 500.
 */
export function isCheckConstraintViolation(error: unknown): boolean {
  if (!isPrismaKnownError(error)) {
    return false;
  }

  if (readMetaCode(error.meta) === CHECK_VIOLATION_SQLSTATE) {
    return true;
  }

  return /violates check constraint|check constraint/i.test(error.message);
}

/**
 * Extrae el nombre de la restricción CHECK violada (o `null` si no se puede
 * determinar). Permite responder con un mensaje específico para cada CHECK.
 */
export function checkConstraintName(error: unknown): string | null {
  if (!isPrismaKnownError(error)) {
    return null;
  }

  const match = /constraint "([^"]+)"/i.exec(error.message);
  return match?.[1] ?? null;
}
