/**
 * Contratos de administración de usuarios (fase 2.4 — RF-07, RF-08 y RF-09).
 *
 * Cubren el panel administrativo de identidad:
 *   - `GET  /api/v1/admin/users`            (listado con búsqueda y filtros)
 *   - `GET  /api/v1/admin/users/{id}`       (detalle administrativo)
 *   - `PATCH /api/v1/admin/users/{id}/status` (cambio de estado)
 *   - `PATCH /api/v1/admin/users/{id}/role`   (cambio de rol)
 *
 * La proyección `AdminUser` NUNCA incluye `passwordHash`, refresh tokens ni
 * datos internos de sesión. `documento` y `celular` sí forman parte del
 * detalle porque son criterios de búsqueda del panel y datos de contacto
 * legítimos para un administrador.
 */
import { z } from "zod";
import { ROLE_NAMES } from "./authSchemas";

/** Estados de cuenta soportados por el dominio (`UserStatus`). */
export const USER_STATUSES = ["ACTIVO", "INACTIVO", "SUSPENDIDO"] as const;

/** Proyección administrativa de un usuario (sin secretos). */
export const adminUserSchema = z.object({
  id: z.uuid(),
  nombre: z.string().min(1),
  correo: z.string().min(1),
  documento: z.string().min(1),
  celular: z.string().min(1),
  rol: z.enum(ROLE_NAMES),
  estado: z.enum(USER_STATUSES),
  verificado: z.boolean(),
  fechaRegistro: z.string().min(1),
});

/** Respuesta paginada de `GET /api/v1/admin/users`. */
export const adminUserListSchema = z.object({
  items: z.array(adminUserSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().min(1).max(100),
  offset: z.number().int().nonnegative(),
});

/**
 * Query de `GET /api/v1/admin/users`.
 *
 * `search` busca en nombre, correo, documento y celular (case-insensitive).
 * Los parámetros llegan como strings: Zod coacciona `limit`/`offset`.
 */
export const adminUsersQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .min(2, "La búsqueda debe tener al menos 2 caracteres")
    .max(80, "La búsqueda no puede superar 80 caracteres")
    .optional(),
  rol: z.enum(ROLE_NAMES).optional(),
  estado: z.enum(USER_STATUSES).optional(),
  limit: z.coerce
    .number({ error: "El límite debe ser numérico" })
    .int("El límite debe ser un entero")
    .min(1, "El límite debe estar entre 1 y 100")
    .max(100, "El límite debe estar entre 1 y 100")
    .default(20),
  offset: z.coerce
    .number({ error: "El offset debe ser numérico" })
    .int("El offset debe ser un entero")
    .min(0, "El offset no puede ser negativo")
    .default(0),
});

/** Cuerpo de `PATCH /api/v1/admin/users/{id}/status`. */
export const updateUserStatusSchema = z.object({
  estado: z.enum(USER_STATUSES),
});

/**
 * Cuerpo de `PATCH /api/v1/admin/users/{id}/role`.
 *
 * Se recibe como string (no enum) para que un rol inexistente llegue al caso
 * de uso y responda `422 ROLE_NOT_FOUND`, el mismo contrato que el registro.
 * Los valores válidos se documentan en la descripción del campo.
 */
export const updateUserRoleSchema = z.object({
  rol: z
    .string({ error: "El rol es obligatorio" })
    .trim()
    .min(1, "El rol es obligatorio")
    .max(64, "El rol no es válido")
    .describe(
      "Nombre del rol: productor | comprador_b2c | comprador_b2b | transportista | administrador",
    ),
});

export type UserStatus = (typeof USER_STATUSES)[number];
export type AdminUser = z.infer<typeof adminUserSchema>;
export type AdminUserList = z.infer<typeof adminUserListSchema>;
export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
