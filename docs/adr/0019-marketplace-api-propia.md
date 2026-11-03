# ADR-019 — Marketplace sobre API propia (retiro de Supabase/PostgREST)

- **Estado:** Aceptada — 2.3a implementada
- **Fecha:** 2026-11-03
- **Decisores:** fAb Orq, tech lead, equipo frontend/backend
- **Relacionado:** ADR-009, ADR-015, ADR-016, ADR-017, ADR-018

## Contexto

El prototipo del marketplace (M03) leía la tabla `properties` directamente
desde el navegador con `@supabase/supabase-js` y la anon key. Esa decisión fue
útil para validar el producto, pero dejó tres problemas:

1. **Disponibilidad:** el proyecto Supabase de producción
   (`fwmaehhzfydbhilpfbrl.supabase.co`) devuelve `ENOTFOUND`; el marketplace
   dependía de un servicio externo que no resuelve.
2. **Seguridad:** la anon key y las políticas RLS eran la única barrera entre el
   navegador y la base; la auditoría P0-06 seguía abierta.
3. **Arquitectura:** el catálogo no pasaba por la API NestJS, no tenía contrato
   Zod/OpenAPI ni validación de servidor, y duplicaba el modelo de datos.

El plan T6 ya registraba la migración 2.3 como prioridad 2. El usuario autorizó
suspender la recuperación de Supabase y ejecutar esa migración.

## Decisión

Migrar la **lectura** del marketplace a la API propia:

- Modelo Prisma `Product` con enums de cultivo/certificación, imágenes y
  coordenadas en JSONB, checks de productividad/coordenadas e índices.
- Contrato Zod compartido (`productSchema`, `productsQuerySchema`) y OpenAPI
  `GET /api/v1/products` con búsqueda, filtros, `limit` y `offset`.
- Módulo NestJS `marketplace` con dominio, puerto, caso de uso, repositorio
  Prisma y controller público.
- Frontend `services/productsApi.ts`; se elimina `services/supabase.ts` y la
  dependencia `@supabase/supabase-js`.
- Fallback de datos demo si la API falla; timeout de 5 s para no bloquear la UI.
- Seed idempotente de 10 productos para desarrollo.

La escritura (`POST /products`) queda para 2.3b porque requiere autenticación
de productor, autorización por rol y carga de imágenes a Cloudinary.

## Alternativas consideradas

1. **Mantener Supabase y recuperar el proyecto:** descartada por el usuario;
   además perpetúa el acceso directo a la base desde el navegador y la deuda RLS.
2. **GraphQL o BFF dedicado:** descartada por sobreingeniería para un catálogo
   de lectura con un contrato REST ya existente.
3. **Leer `plots` y reutilizar M16:** descartada porque `Plot` no modela precio,
   cultivo, productividad, certificación ni imágenes; habría mezclado dos
   conceptos y roto el contrato del marketplace.

## Consecuencias

- **Positivas:** una sola puerta de entrada a los datos (NestJS), validación de
  servidor, contrato tipado, eliminación de la anon key del bundle y un chunk
  de marketplace mucho menor. El fallback demo sigue cubriendo la indisponibilidad.
- **Negativas:** se agrega una migración y un modelo que deben mantenerse; el
  seed es manual y `POST /products` aún no existe.
- **Operación:** el marketplace ya no depende de Supabase. La autenticación y
  `/health/ready` siguen dependiendo de la base PostgreSQL de la API hasta que
  se complete el despliegue en el nuevo entorno.

## Evidencia

- Migración `20261103114851_add_marketplace_products`; se corrigió el SQL
  generado por Prisma para no eliminar los índices GIST de PostGIS.
- `GET /api/v1/products` con contrato Zod/OpenAPI sin drift.
- Backend: **225 tests**, cobertura **94.62 % líneas / 81.64 % ramas**.
- Frontend: **45 unitarios**, build verde; `MarketplacePrototype` pasó de
  ~281 kB a **65.64 kB** (17.79 kB gzip) al retirar Supabase.
- E2E: **10/10** con demo/fallback contra `/api/v1/products`.
- `@supabase/supabase-js` eliminado de `package.json` y del lockfile.
