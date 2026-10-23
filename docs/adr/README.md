# Registro de decisiones de arquitectura (ADR) — AgroConnect

Hay dos series de ADR:

- **ADR-001 a ADR-007:** pertenecen al informe oficial **PT-AR-ARQ-01 §10** en Notion.
- **ADR-008 en adelante:** continúan esa numeración y viven en este directorio. Los archivos usan prefijo de 4 dígitos.
- **ADR-0001:** es una decisión operativa anterior a esta convención y conserva su número.

| ADR | Decisión | Estado |
|---|---|---|
| ADR-001 | Flutter para la app móvil | Sustituida por ADR-012 |
| ADR-002 | PostgreSQL 16 + PostGIS | Aceptada — implementada |
| ADR-003 | Cloudinary para multimedia | Aceptada — implementada |
| ADR-004 | React + Vite SPA (sin Next.js) | Aceptada — implementada |
| ADR-005 | Clean Architecture de 4 capas | Aceptada — implementada |
| ADR-006 | UUID local + Last-Write-Wins offline | Planificada |
| ADR-007 | Leaflet + OpenStreetMap | Aceptada — implementada |
| [ADR-0001](0001-estrategia-imagenes-externas.md) | Estrategia de imágenes externas | Aceptada — implementada |
| [ADR-008](0008-monolito-modular.md) | Monolito modular | Aceptada |
| [ADR-009](0009-stack-backend-nestjs.md) | Núcleo backend NestJS 11 + Prisma 7 + Node 24 | Aceptada |
| [ADR-010](0010-estrategia-de-sesion.md) | Access token en memoria + refresh en cookie httpOnly | Aceptada |
| [ADR-011](0011-politica-poliglota.md) | Política políglota: núcleo homogéneo, bordes políglotas | Aceptada |
| [ADR-012](0012-app-movil-expo.md) | App móvil con Expo / React Native | Aceptada (sustituye a ADR-001) |
| [ADR-013](0013-motor-de-rutas-externo.md) | Rutas óptimas con motor externo (`RouteOptimizer`) | Aceptada |
| [ADR-014](0014-servicio-agro-intelligence-python.md) | Satélite Python `agro-intelligence` | Aceptada (post-MVP) |
| [ADR-015](0015-monorepo-contract-first.md) | Monorepo npm workspaces + Turborepo, contract-first | Aceptada |

Para una decisión nueva, copia la estructura de cualquier ADR: Estado, Fecha, Decisores, Relacionado, Contexto, Decisión, Alternativas y Consecuencias. Enlázala aquí y en el índice de ADRs de Obsidian.
