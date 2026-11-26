import { DomainError } from '../../../../shared/errors/errors';
import { Role, type RoleName } from '../../domain/entities/Role';
import { USER_STATUSES, type UserStatus } from '../../domain/entities/User';
import type { UserRepository } from '../../domain/interfaces/UserRepository';
import { toAdminUserView, type AdminUserActor, type AdminUserView } from '../dtos/adminUserDtos';

export interface ListAdminUsersFilters {
  search?: string;
  rol?: string;
  estado?: string;
  limit: number;
  offset: number;
}

export interface AdminUsersPageView {
  items: AdminUserView[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * Lista usuarios para el panel administrativo.
 *
 * La validación primaria vive en el contrato Zod del controller; este caso de
 * uso repite los límites y valida los filtros como defensa en profundidad,
 * igual que `ListProductsUseCase`.
 */
export class ListAdminUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    actor: AdminUserActor,
    filters: ListAdminUsersFilters,
  ): Promise<AdminUsersPageView> {
    if (actor.role !== 'administrador') {
      throw new DomainError('FORBIDDEN', 'Solo un administrador puede gestionar usuarios', 403);
    }

    const { limit, offset } = filters;

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new DomainError('VALIDATION_ERROR', 'El límite debe estar entre 1 y 100', 422);
    }

    if (!Number.isInteger(offset) || offset < 0) {
      throw new DomainError('VALIDATION_ERROR', 'El offset debe ser un entero no negativo', 422);
    }

    const page = await this.userRepository.findManyForAdmin({
      search: this.normalizeSearch(filters.search),
      roleName: this.parseRole(filters.rol),
      status: this.parseStatus(filters.estado),
      limit,
      offset,
    });

    return {
      items: page.items.map(toAdminUserView),
      total: page.total,
      limit,
      offset,
    };
  }

  /** Valida el rol de filtro sin depender del enum del contrato. */
  private parseRole(value: string | undefined): RoleName | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (!Role.isValidName(value)) {
      throw new DomainError('VALIDATION_ERROR', `El rol "${value}" no es válido`, 422);
    }
    return value;
  }

  /** Valida el estado de filtro contra la lista canónica del dominio. */
  private parseStatus(value: string | undefined): UserStatus | undefined {
    if (value === undefined) {
      return undefined;
    }
    if (!(USER_STATUSES as readonly string[]).includes(value)) {
      throw new DomainError('VALIDATION_ERROR', 'El estado no es válido', 422);
    }
    return value as UserStatus;
  }

  /**
   * Limpia la búsqueda para que los comodines de SQL (`%`, `_`) no alteren la
   * consulta, y exige el rango 2..80 del contrato.
   */
  private normalizeSearch(value: string | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalized = value
      .trim()
      .replace(/[%_,()'"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);

    if (normalized.length < 2) {
      throw new DomainError(
        'VALIDATION_ERROR',
        'La búsqueda debe tener entre 2 y 80 caracteres',
        422,
      );
    }

    return normalized;
  }
}
