# ADR-008: Monolito modular como estilo arquitectónico del backend

- **Estado**: Aceptada
- **Fecha**: 2026-10-22
- **Decisores**: Equipo AgroConnect (SM, PO, desarrolladores)
- **Relacionado**: ADR-005 (Clean Architecture 4 capas), ADR-009, ADR-011, ADR-015

## Contexto y problema

AgroConnect debe crecer desde dos módulos implementados (M02 autenticación y la base de M16 geolocalización) hasta 17 módulos. Varios de ellos comparten transacciones de negocio: un pedido reserva inventario, genera un pago y dispara notificaciones.

Las restricciones son:

- Equipo de 4 aprendices.
- Calendario del programa SENA ADSO.
- Hosting gratuito: Render free con 512 MB y suspensión por inactividad, y Supabase free.

El código actual ya está organizado por módulo (`modules/auth`, `modules/geography`), pero la separación no se hace cumplir. El módulo `geography` creó su propio cliente Prisma global y su propio formato de error, ignorando la composición de `app.ts`.

## Decisión

El backend será un **monolito modular**:

1. **Un solo despliegue y una sola base de datos**, con un **schema lógico por módulo** (`identity`, `catalog`, `inventory`, `ordering`, `payments`, `logistics`, `geo`, `messaging`, `support`, `audit`).
2. **Cada módulo es un bounded context** con capas `domain/ application/ infrastructure/ presentation/` (ADR-005). Expone solo su **API pública** (`index.ts`: fachada y eventos).
3. **Comunicación entre módulos** solo mediante:
   - la fachada pública, para lecturas y comandos síncronos, o
   - eventos de dominio publicados con **outbox transaccional**, para efectos secundarios.

   Ningún módulo importa repositorios, entidades ni tablas de otro.
4. **Reglas de dependencia verificadas en CI** con `dependency-cruiser`.

## Alternativas consideradas

- **Microservicios por módulo**:
  - Ventajas: escalado y despliegue independientes.
  - Desventajas: transacciones distribuidas (sagas) para pedido↔inventario↔pago, N pipelines, N servicios que se suspenden en el plan free, trazabilidad distribuida y un costo operativo desproporcionado para 4 personas.
  - Decisión: rechazada.
- **Monolito en capas sin módulos** (como el actual):
  - Ventajas: simple.
  - Desventajas: degenera en acoplamiento global a medida que crecen los 17 módulos; ya hay evidencia de deriva.
  - Decisión: rechazada.
- **Backend-as-a-Service puro** (Supabase Edge Functions + RLS):
  - Ventajas: rápido para CRUD.
  - Desventajas: la lógica de negocio queda dispersa entre SQL y funciones, los patrones son difíciles de probar y de sustentar (RAP 220501095), y contradice el diseño oficial (Express/Prisma).
  - Decisión: rechazada como núcleo.

## Consecuencias

- **Positivas**:
  - Transacciones ACID locales.
  - Un solo pipeline y un solo despliegue.
  - Límites explícitos que permiten extraer un módulo a un servicio más adelante sin reescribirlo.
  - Evidencia clara de arquitectura para la sustentación.
- **Negativas**:
  - Todos los módulos escalan juntos.
  - Un error grave en un módulo puede afectar al proceso completo.
  - Exige disciplina de límites, que se mitiga con la herramienta de CI.
- **Mitigaciones**:
  - `dependency-cruiser` en CI.
  - Fachadas tipadas.
  - Pruebas de integración por módulo.
  - Política políglota (ADR-011) para sacar del núcleo solo lo que lo justifique.
