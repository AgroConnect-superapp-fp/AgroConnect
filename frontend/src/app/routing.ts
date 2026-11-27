import { SELF_REGISTRATION_ROLE_OPTIONS, type RoleName } from '../auth/types';

/** Roles que un visitante puede elegir al registrarse (sin `administrador`). */
const SELF_REGISTRABLE_ROLES: readonly RoleName[] = SELF_REGISTRATION_ROLE_OPTIONS.map(
  (option) => option.id
);

/** Rol de registro por defecto cuando el parámetro falta o es inválido. */
export const DEFAULT_ROLE: RoleName = 'productor';

/**
 * Valida el parámetro `?rol=` del registro contra los roles auto-registrables.
 * El backend ya rechaza `administrador`; el frontend evita mostrarlo siquiera.
 */
export function parseRole(value: string | null): RoleName {
  return SELF_REGISTRABLE_ROLES.includes(value as RoleName)
    ? (value as RoleName)
    : DEFAULT_ROLE;
}

/**
 * Origen ficticio para resolver rutas relativas sin depender del host actual.
 * Cualquier valor que cambie el origen se considera redirección externa.
 */
const INTERNAL_ORIGIN = 'https://agroconnect.invalid';
const FORBIDDEN_RETURN_TO = /\\|%5c|%09|%0a|%0d/i;

/**
 * Solo acepta rutas internas como destino de retorno. Normaliza con `URL` y
 * compara el origen, lo que cierra variantes como `/\evil.example`,
 * `//host` o `/%5Cevil.example` que el parser interpreta como externas.
 */
export function safeReturnTo(value: string | null, fallback = '/panel'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  if (FORBIDDEN_RETURN_TO.test(value)) {
    return fallback;
  }

  try {
    const url = new URL(value, INTERNAL_ORIGIN);

    if (url.origin !== INTERNAL_ORIGIN) {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/**
 * Traduce los enlaces heredados de los correos (`/?resetToken=…` y
 * `/?verifyToken=…`) a rutas con token. Mantiene válidos los enlaces ya
 * enviados durante la migración al router.
 */
export function legacyTokenTarget(search: string): string | null {
  const params = new URLSearchParams(search);
  const resetToken = params.get('resetToken');

  if (resetToken) {
    return `/reset?token=${encodeURIComponent(resetToken)}`;
  }

  const verifyToken = params.get('verifyToken');

  if (verifyToken) {
    return `/verificar?token=${encodeURIComponent(verifyToken)}`;
  }

  return null;
}
