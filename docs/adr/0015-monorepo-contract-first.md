# ADR-015: Monorepo con npm workspaces + Turborepo y desarrollo contract-first

- **Estado**: Aceptada
- **Fecha**: 2026-10-22
- **Decisores**: Equipo AgroConnect
- **Relacionado**: ADR-009, ADR-011, ADR-012, ADR-014

## Contexto y problema

Hoy las reglas de validación de autenticación existen dos veces, sin vínculo entre sí:

- `backend/src/modules/auth/presentation/schemas/authSchemas.ts`
- `frontend/src/auth/schemas/authSchemas.ts`

Con la app móvil (ADR-012) y el satélite Python (ADR-014) habría cuatro copias. Además, el CI ejecuta todo en cada cambio, sin distinguir qué parte del repositorio cambió.

## Decisión

1. **Monorepo con npm workspaces y Turborepo** en la raíz.
   - Se conservan los directorios `backend/` y `frontend/` para no cambiar el `rootDir` de Vercel ni de Render.
   - Se agregan:
     - `packages/contracts`: esquemas Zod y OpenAPI generado.
     - `packages/config`: tsconfig, ESLint y Prettier compartidos.
     - `mobile/` cuando llegue la iteración de la app.
     - `services/agro-intelligence/` cuando llegue el satélite.
2. **Contract-first:**
   - Todo endpoint nace en `packages/contracts` (Zod).
   - Del contrato se generan el OpenAPI 3.1, los clientes TypeScript (`openapi-typescript`) y los modelos Pydantic (`datamodel-code-generator`).
   - El CI falla si los artefactos generados no coinciden con el contrato (*drift check*).
3. **CI por camino:** filtros por ruta y `turbo run ... --affected`, con caché de tareas.
4. **Reglas de límites:** `dependency-cruiser` impide importar el interior de otro módulo (ADR-008).

## Alternativas consideradas

- **Repositorios separados por aplicación:** aislamiento total, pero contratos desincronizados, PRs cruzados y más carga de gobernanza. Rechazada.
- **pnpm workspaces o Nx:** técnicamente superiores en algunos aspectos, pero cambiar de gestor de paquetes o adoptar Nx suma curva sin beneficio proporcional. Se mantiene npm.

## Consecuencias

- **Positivas**:
  - Un solo contrato para web, móvil, API y Python.
  - CI más rápido.
  - Cambios atómicos entre capas.
- **Negativas**:
  - Hay que reorganizar scripts y el CI.
  - Turborepo es una dependencia más.
- **Mitigaciones**: migración incremental (primero el contrato de auth) y documentación en `CONTRIBUTING.md`.
