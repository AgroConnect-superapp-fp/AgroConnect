import type { Request } from 'express';

/**
 * Identidad mínima que un guard de sesión adjunta a la petición.
 *
 * No incluye tokens ni datos sensibles: solo lo necesario para autorizar y
 * atribuir una operación (por ejemplo, el `producerId` de un producto).
 */
export interface AuthenticatedUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export type AuthenticatedRequest = Request & { user?: AuthenticatedUser };
