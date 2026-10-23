# ADR-009: Stack del núcleo backend — NestJS 11 + Prisma 7 sobre Node.js 24 LTS

- **Estado**: Aceptada
- **Fecha**: 2026-10-22
- **Decisores**: Equipo AgroConnect
- **Relacionado**: ADR-002 (PostgreSQL + PostGIS), ADR-005, ADR-008, ADR-010, ADR-015

## Contexto y problema

El monolito modular (ADR-008) necesita, para todos sus módulos:

- inyección de dependencias,
- guards de autenticación y autorización,
- validación,
- manejo uniforme de errores,
- tareas programadas,
- eventos,
- websockets,
- documentación OpenAPI.

Hoy el backend usa Express 4 con composición manual en `app.ts`. Funciona para un módulo, pero cada módulo nuevo tendría que reconstruir y mantener esas convenciones a mano.

## Opciones evaluadas (1 = peor, 5 = mejor)

| Criterio | NestJS 11 + TS | Express 5 / Fastify 5 a mano | Spring Boot + Modulith (Java 21) | ASP.NET Core 9 |
|---|---|---|---|---|
| Estructura modular, DI y guards de fábrica | 5 | 2 | 5 | 4 |
| Reutilización de código y pruebas actuales | 4 | 5 | 1 | 1 |
| Contratos compartidos con el frontend TS | 5 | 5 | 2 | 2 |
| Curva para el equipo y plazo SENA | 4 | 4 | 2 | 2 |
| Huella en Render free (512 MB) | 4 | 5 | 2 | 3 |
| Ecosistema (pagos CO, PostGIS, colas, WS) | 5 | 4 | 5 | 4 |
| Defensa académica de patrones | 5 | 3 | 5 | 5 |
| **Total** | **32** | 28 | 22 | 21 |

## Decisión

El núcleo backend usará:

- **Runtime:** Node.js 24 LTS, la misma versión en local, CI, Render y Vercel.
- **Framework:** NestJS 11 (`@nestjs/platform-express`).
- **Lenguaje:** TypeScript strict.
- **Validación y contratos:** Zod 4 (`nestjs-zod`) y OpenAPI 3.1 (`@nestjs/swagger`) generado desde `packages/contracts` (ADR-015).
- **Persistencia:** Prisma 7 con `@prisma/adapter-pg`, multi-schema y TypedSQL para PostGIS.
- **Colas y tareas programadas:** pg-boss (cola sobre PostgreSQL, sin Redis) y `@nestjs/schedule`.
- **Eventos:** `@nestjs/event-emitter` + outbox transaccional.
- **Tiempo real:** `@nestjs/websockets` (Socket.IO).
- **Observabilidad:** `nestjs-pino` con correlationId, Sentry, `/health` y `/ready`.
- **Pruebas:** Jest 30 + `@swc/jest`, Supertest y Testcontainers PostGIS.

La migración es **incremental**:

- Las capas `domain/` y `application/` actuales no dependen de Express y se trasladan casi sin cambios.
- Solo se reescriben `presentation/` (controllers, guards, pipes) y el cableado de dependencias.

## Consecuencias

- **Positivas**:
  - Las convenciones son las del framework y no dependen de la disciplina individual.
  - Los guards de auth y RBAC, los pipes de validación y los filtros de excepción son nativos.
  - OpenAPI se genera automáticamente.
  - Hay amplia documentación y empleabilidad para el equipo.
- **Negativas**:
  - Hay una curva de aprendizaje: decoradores, módulos y providers.
  - Hay que portar la capa HTTP de auth y adaptar las pruebas de integración.
  - El arranque es algo más pesado que Express puro.
- **Mitigaciones**:
  - Se migra módulo por módulo con CI verde en cada PR.
  - Las pruebas de dominio y de casos de uso no cambian.
  - Plan B documentado: Express 5 con DI explícita (awilix) y `dependency-cruiser`, si el equipo no logra absorber NestJS.
