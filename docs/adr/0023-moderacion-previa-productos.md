# ADR-023 — Moderación previa de productos

- **Estado:** Aceptada — implementada
- **Fecha:** 2026-11-05
- **Decisores:** Fabián Gallego (Product Owner técnico), equipo AgroConnect
- **Relacionado:** ADR-019 (marketplace), ADR-022 (vitrina)

## Contexto

El marketplace permitía que una publicación apareciera inmediatamente. Para
reducir contenido fraudulento o incompleto se requiere una revisión
administrativa antes de la vitrina pública, sin bloquear la edición del
productor.

## Decisión

- `Product.moderationStatus`: `pending | approved | rejected`, por defecto
  `pending` para publicaciones nuevas.
- `POST /products` crea en `pending`; `GET /products` solo devuelve `approved`.
- `GET /products/pending` y `PATCH /products/:id/moderation` son exclusivos del
  rol `administrador`.
- Si un productor cambia las imágenes de un producto aprobado, vuelve a
  `pending`; un administrador puede editar sin perder la aprobación.
- Los productos existentes/seed se migran como `approved`.
- El productor recibe un aviso explícito de “pendiente de revisión”.

## Consecuencias

- La vitrina pública no muestra productos sin revisar.
- El productor conserva la posibilidad de corregir y reenviar.
- Se requiere un administrador activo para operar el marketplace.
