import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  adminUsersQuerySchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
  type AdminUsersQuery,
  type UpdateUserRoleInput,
  type UpdateUserStatusInput,
} from '@agroconnect/contracts';
import { ListAdminUsersUseCase } from '../../application/use-cases/ListAdminUsersUseCase';
import { GetAdminUserUseCase } from '../../application/use-cases/GetAdminUserUseCase';
import { UpdateUserStatusUseCase } from '../../application/use-cases/UpdateUserStatusUseCase';
import { UpdateUserRoleUseCase } from '../../application/use-cases/UpdateUserRoleUseCase';
import { ZodValidationPipe } from '../../../../shared/http/zod-validation.pipe';
import { success } from '../../../../shared/http/responses';
import type { AuthenticatedRequest } from '../../../../shared/http/authenticated-user';
import { AuthThrottlerGuard } from '../guards/AuthThrottlerGuard';
import { Roles } from '../guards/roles.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { SessionAuthGuard } from '../guards/SessionAuthGuard';

/**
 * Administración de usuarios (fase 2.4 — RF-07, RF-08 y RF-09).
 *
 * Todos los endpoints exigen sesión, rol `administrador` y rate limiting. Las
 * reglas de negocio (auto-modificación, último administrador activo,
 * revocación de sesiones) viven en los casos de uso; el `RolesGuard` es el
 * rechazo temprano antes de llegar al dominio.
 */
@Controller('admin/users')
@UseGuards(SessionAuthGuard, RolesGuard, AuthThrottlerGuard)
@Roles('administrador')
export class AdminUserController {
  constructor(
    private readonly listAdminUsersUseCase: ListAdminUsersUseCase,
    private readonly getAdminUserUseCase: GetAdminUserUseCase,
    private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
    private readonly updateUserRoleUseCase: UpdateUserRoleUseCase,
  ) {}

  /** Lista paginada con búsqueda por nombre, correo, documento o celular. */
  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async findAll(
    @Req() request: AuthenticatedRequest,
    @Query(new ZodValidationPipe(adminUsersQuerySchema, 'Parámetros de búsqueda inválidos'))
    query: AdminUsersQuery,
  ): Promise<unknown> {
    const user = request.user!;
    const page = await this.listAdminUsersUseCase.execute(
      { id: user.id, role: user.role },
      {
        search: query.search,
        rol: query.rol,
        estado: query.estado,
        limit: query.limit,
        offset: query.offset,
      },
    );

    return success(page, 'Usuarios obtenidos correctamente');
  }

  /** Detalle administrativo de un usuario. */
  @Get(':id')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async findOne(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<unknown> {
    const user = request.user!;
    const adminUser = await this.getAdminUserUseCase.execute({ id: user.id, role: user.role }, id);
    return success(adminUser, 'Usuario obtenido correctamente');
  }

  /** Cambia el estado de la cuenta (`ACTIVO` | `INACTIVO` | `SUSPENDIDO`). */
  @Patch(':id/status')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async updateStatus(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(updateUserStatusSchema, 'Estado de usuario inválido'))
    body: UpdateUserStatusInput,
  ): Promise<unknown> {
    const user = request.user!;
    const adminUser = await this.updateUserStatusUseCase.execute(
      { id: user.id, role: user.role },
      id,
      body.estado,
    );
    return success(adminUser, 'Estado del usuario actualizado correctamente');
  }

  /** Cambia el rol de la cuenta y revoca sus sesiones. */
  @Patch(':id/role')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async updateRole(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body(new ZodValidationPipe(updateUserRoleSchema, 'Rol de usuario inválido'))
    body: UpdateUserRoleInput,
  ): Promise<unknown> {
    const user = request.user!;
    const adminUser = await this.updateUserRoleUseCase.execute(
      { id: user.id, role: user.role },
      id,
      body.rol,
    );
    return success(adminUser, 'Rol del usuario actualizado correctamente');
  }
}
