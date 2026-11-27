import { DomainError } from '../../../shared/errors/errors';

/**
 * Actor autenticado que opera sobre las parcelas.
 *
 * El `id` es el `farmerId` (propietario) y el `role` el rol del catálogo. El
 * actor lo construye el controller a partir de la sesión; nunca viaja en el
 * cuerpo de la petición.
 */
export interface PlotActor {
  id: string;
  role: string;
}

/**
 * Roles autorizados para gestionar parcelas (alta, edición, baja y listado
 * propio). El catálogo real es `administrador | comprador_b2b | comprador_b2c |
 * productor | transportista`: solo el productor administra su finca y el
 * administrador la supervisa.
 */
export const PLOT_WRITE_ROLES: readonly string[] = ['productor', 'administrador'];

/**
 * Valida, en la CAPA DE APLICACIÓN, que el actor puede gestionar parcelas.
 *
 * Esta es la validación autoritativa: el `RolesGuard` del presentation solo
 * rechaza temprano. Si el caso de uso se invoca por otro adaptador (cola,
 * script, job), la regla se sigue aplicando.
 */
export function assertPlotWriteRole(actor: PlotActor): void {
  if (!actor.id) {
    throw new DomainError(
      'UNAUTHORIZED',
      'Se requiere una sesión autenticada para gestionar parcelas',
      401,
    );
  }

  if (!PLOT_WRITE_ROLES.includes(actor.role)) {
    throw new DomainError(
      'FORBIDDEN',
      'Solo un productor o un administrador puede gestionar parcelas',
      403,
    );
  }
}
