# ADR-025 — Tipos OpenAPI generados, sin cliente HTTP runtime

- **Estado:** Aceptada — implementada
- **Fecha:** 2026-11-26
- **Decisores:** Fabián Gallego (Product Owner técnico), equipo AgroConnect
- **Relacionado:** ADR-015 (monorepo contract-first), ADR-024 (router, datos y UI)

## Contexto

`packages/contracts/openapi.json` describe 17 endpoints y se genera desde los
esquemas Zod. Los servicios del frontend (`productsApi`, `plotsApi`,
`profileApi`, `authClient`) ya consumen `@agroconnect/contracts` y pasan por
`apiClient`, que concentra:

- cookies `httpOnly` con `credentials: 'include'`;
- refresh silencioso y emisión de `session-expired`;
- timeouts por endpoint;
- el sobre `{ success, data, message }` y los errores `ApiError`.

El plan de fase 3 dejó como seguimiento un “cliente OpenAPI tipado”. La
pregunta era si introducir un cliente runtime (`openapi-fetch`, `orval`) o
limitarse a tipos generados.

## Decisión

Generar **solo tipos** desde el OpenAPI y usarlos como guard de contrato en
compilación:

- `frontend/src/shared/api/openapi.d.ts` se genera con `openapi-typescript`
  (`npm run generate:api-types`).
- `frontend/src/shared/api/openapi.contract.ts` verifica con tipos condicionales
  que las respuestas de `/products`, `/profile/me`, `/plots` y el cuerpo de
  publicación sean asignables a los tipos Zod que usan los servicios.
- CI ejecuta `check:api-types`, que regenera y falla si el archivo commiteado
  quedó desactualizado.

No se añade un cliente HTTP runtime. `apiClient` sigue siendo el único punto de
red.

## Alternativas descartadas

| Alternativa | Motivo para descartarla |
| --- | --- |
| `openapi-fetch` | Duplicaría refresh, cookies, timeouts y el desempaquetado del sobre; dos clientes HTTP compitiendo es justo lo que D2 evita en caché. |
| `orval`/cliente generado completo | Añade runtime y superficie generada que habría que versionar; los servicios actuales ya son pequeños y tipados. |
| Tipos manuales | Deriva silenciosa entre Zod, OpenAPI y frontend; el guard en compilación la detecta. |

## Consecuencias

**Positivas**

- Una sola capa de red y una sola política de sesión.
- El contrato Zod, el OpenAPI y los tipos del frontend quedan amarrados en
  `tsc`; cualquier cambio incompatible rompe la compilación.
- Cero impacto en el bundle: `openapi.d.ts` es solo tipos.

**Negativas / trade-offs**

- `openapi-typescript@7` declara peer `typescript@^5`; el repo usa TypeScript 6.
  La instalación requirió `--legacy-peer-deps`. Es una herramienta de
  generación, no runtime; se revisará cuando publique soporte para TS 6.
- El archivo generado (≈1.900 líneas) debe regenerarse y commitearse cuando
  cambie el contrato.
- No se obtiene validación runtime del response; esa responsabilidad sigue en
  Zod/backend y en las pruebas.

## Evidencia

- Se corrigió una `$ref` rota: `UpdateProductModerationRequestBody` no estaba
  registrado en `packages/contracts/src/openapi.ts`. `check:drift` queda en
  verde y un escaneo de `$ref` no encuentra referencias colgantes.
- `npm run check:api-types -w agroconnect-frontend` regenera sin diff.
- `tsc --noEmit` valida los cuatro guards de contrato.
