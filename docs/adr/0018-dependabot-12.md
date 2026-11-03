# ADR-018 — Ventana Dependabot 12

- **Estado:** Aceptada — alcance parcial
- **Fecha:** 2026-11-03
- **Decisores:** fAb Orq, tech lead, seguridad
- **Relacionado:** ADR-009, ADR-015, ADR-016

## Contexto

La auditoría dejó 46 vulnerabilidades (4 low, 42 moderate, 0 high/critical), casi
todas en dependencias de desarrollo. Los PRs #66 (`@nestjs/common` 12), #65
(`@nestjs/platform-express` 12) y #68 (TypeScript 7) estaban cerrados y la
ventana autorizada debía ejecutarse con pruebas completas.

## Decisión

Actualizar solo lo que tiene soporte verificado y reducir el riesgo restante:

- `@nestjs/cli` 11.0.24 → **12.0.11** (herramienta de build, no runtime).
- Override `minimatch` → **11.0.4** para toda la cadena de tooling.
- Override `deepmerge` → **4.3.1**.

No se actualizan el núcleo de NestJS ni TypeScript todavía.

## Evidencia de bloqueo

- `@nestjs/common@12.3.2`, `@nestjs/core@12.3.2` y
  `@nestjs/platform-express@12.3.2` son **ESM-only** (`"type": "module"`,
  exports `./*.js`, sin entrada CJS). El backend compila a CommonJS
  (`module: CommonJS`, `moduleResolution: Node`) y Jest corre con `ts-jest` en
  CJS; migrar el runtime completo a ESM queda fuera del alcance de esta ventana.
- Los peers de configuración y JWT **sí aceptan 12**:
  `@nestjs/config@12.0.1` declara `@nestjs/common` `^11 || ^12` y
  `@nestjs/jwt@12.0.3` declara `^8 || ^9 || ^10 || ^11 || ^12`. No son el
  bloqueo.
- `ts-jest@29.4.15` declara peer `typescript` `>=4.3 <7`; TS 7 queda fuera.
- `@typescript-eslint/parser@8.72.1` declara peer `typescript` `>=4.8.4 <6.1`;
  TS 7 queda fuera.
- Forzar `--legacy-peer-deps` no resuelve el problema real (ESM vs. CJS) y
  ocultaría incompatibilidades de runtime; se descarta.

## Resultado medido

- `npm audit`: **46 → 22** (5 low, 17 moderate, 0 high/critical).
- `minimatch`: corregido (11.0.4).
- `deepmerge`: 4.3.1; la alerta low residual depende de transitivas de Jest y
  `vite-plugin-pwa` y no tiene fix compatible adicional.
- `lint`, `typecheck`, `build` y **208 tests** verdes; E2E 10/10 en CI.
- `npm audit --audit-level=high` sale 0.

## Consecuencias

- La release `v1.1.2` puede publicarse sin deuda crítica.
- NestJS 12 se reintenta solo dentro de un plan explícito de migración ESM
  (runtime, Nest CLI, Jest y Prisma); no depende de `@nestjs/config` ni
  `@nestjs/jwt`.
- TypeScript 7 se reintenta cuando `ts-jest` y `typescript-eslint` amplíen sus
  peers.
- Las alertas restantes son de desarrollo; no afectan el runtime de producción.
