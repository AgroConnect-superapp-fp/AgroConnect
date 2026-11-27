# ADR-022 — Marketplace vitrina sin precio ni inventario en el MVP

- **Estado:** Aceptada — implementada
- **Fecha:** 2026-11-05
- **Decisores:** Fabián Gallego (Product Owner técnico), equipo AgroConnect
- **Relacionado:** ADR-019 (marketplace API propia), ADR-021 (imágenes)

## Contexto

El marketplace actual publica cosechas con ubicación, cultivo, área,
productividad, certificación, contacto e imágenes. Añadir precio, unidad y
stock antes de cerrar pagos, logística y reglas de reserva introduciría estados
de negocio que todavía no tienen soporte operativo ni contractual.

## Decisión

Mantener el marketplace como **vitrina** durante el MVP:

- No se agregan campos de precio, moneda, unidad ni inventario.
- El contacto y la negociación ocurren fuera de la plataforma.
- La compra transaccional se evaluará después de cerrar pagos, logística y
  políticas de reserva/cancelación.
- Cualquier propuesta de precio/stock requiere un ADR nuevo y migración.

## Consecuencias

- Menor complejidad y menos estados inconsistentes en el MVP.
- No se promete disponibilidad ni precio en tiempo real.
- El modelo `Product` queda estable para la moderación y las imágenes.
