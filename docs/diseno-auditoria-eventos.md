# DISEÑO — AUDITORÍA INMUTABLE DE ACCIONES SENSIBLES

## AgroConnect · cierre H14

**Estado:** implementado en `audit_events` (migración `20261127050630_add_audit_events`); pendiente de revisión de seguridad  
**Fecha:** 26/11/2026  
**Relacionado:** ADR-026, ADR-027, P-01 administración de usuarios

---

## 1. Problema

El MVP registra logs Pino con `correlationId`, pero no tiene una tabla de auditoría persistente e inmutable. No se puede reconstruir quién cambió el estado o el rol de un usuario, ni demostrar que un rol ordinario no alteró el registro.

## 2. Decisión

Crear `audit_events` en PostgreSQL con escritura append-only:

```sql
CREATE TABLE audit_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  actor_id        uuid,
  actor_role      text NOT NULL,
  action          text NOT NULL,
  entity_type     text NOT NULL,
  entity_id       uuid,
  before_data     jsonb,
  after_data      jsonb,
  correlation_id  text,
  ip_hash         text
);

CREATE INDEX audit_events_occurred_at_idx ON audit_events (occurred_at DESC);
CREATE INDEX audit_events_actor_idx ON audit_events (actor_id, occurred_at DESC);
CREATE INDEX audit_events_entity_idx ON audit_events (entity_type, entity_id, occurred_at DESC);
CREATE INDEX audit_events_action_idx ON audit_events (action, occurred_at DESC);
```

## 3. Inmutabilidad

1. El rol de la aplicación solo tiene `INSERT` y `SELECT` sobre `audit_events`.
2. `UPDATE` y `DELETE` se revocan explícitamente.
3. Un trigger defensivo lanza excepción ante `UPDATE`/`DELETE`, incluso si un rol privilegiado lo intenta.
4. La tabla no tiene `ON DELETE CASCADE` desde usuarios: el evento debe sobrevivir a la baja lógica de la cuenta.
5. No se guardan tokens, contraseñas, documentos completos, coordenadas exactas ni PII innecesaria.

## 4. Eventos mínimos

| Acción | Entidad | `before` / `after` |
| --- | --- | --- |
| `admin.user.status_changed` | `user` | `{ estado }` |
| `admin.user.role_changed` | `user` | `{ rol }` |
| `product.moderated` | `product` | `{ moderationStatus }` |
| `auth.password_reset` | `user` | `{}` (sin hash) |
| `auth.email_verified` | `user` | `{}` |
| `plot.deleted` | `plot` | `{ deletedAt }` |

## 5. Puerto de aplicación

```ts
export interface AuditEvent {
  actorId?: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  correlationId?: string;
}

export interface AuditTrail {
  record(event: AuditEvent): Promise<void>;
}
```

Los casos de uso reciben `AuditTrail` por inyección. La infraestructura implementa el puerto con Prisma/SQL; el dominio no conoce Prisma.

## 6. Pruebas de aceptación

1. Un cambio de estado/rol genera exactamente un evento con actor, target y `correlationId`.
2. El evento permite reconstruir el valor anterior y el nuevo.
3. `UPDATE audit_events` falla para el rol de aplicación.
4. `DELETE audit_events` falla para el rol de aplicación.
5. El evento no contiene `passwordHash`, tokens, correo completo ni documento completo.
6. Una transacción fallida no deja evento huérfano.

## 7. Evidencia de cierre H14

- Migración `audit_events`.
- Trigger y permisos.
- Suite de integración con PostgreSQL real.
- Consulta de reconstrucción de un cambio.
- Revisión de seguridad.
