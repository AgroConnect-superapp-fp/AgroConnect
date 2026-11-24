import type { RoleName } from '../auth/types';

const ROLES: readonly RoleName[] = [
  'productor',
  'comprador_b2c',
  'comprador_b2b',
  'transportista',
  'administrador',
];

/** Rol de registro por defecto cuando el parámetro falta o es inválido. */
export const DEFAULT_ROLE: RoleName = 'productor';

/**
 * Valida el parámetro `?rol=` del registro contra el catálogo real de roles.
 * Evita que una URL manipulada llegue al formulario con un rol inexistente.
 */
export function parseRole(value: string | null): RoleName {
  return ROLES.includes(value as RoleName) ? (value as RoleName) : DEFAULT_ROLE;
}

/**
 * Solo acepta rutas internas como destino de retorno. Descarta URLs absolutas
 * y protocol-relative (`//host`) para cerrar redirecciones abiertas.
 */
export function safeReturnTo(value: string | null, fallback = '/panel'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  return value;
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
