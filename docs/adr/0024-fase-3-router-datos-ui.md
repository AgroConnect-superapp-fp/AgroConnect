# ADR-024 — Fase 3 del frontend: router, capa de datos y sistema de componentes

- **Estado:** Aceptada — implementada (F1–F4)
- **Fecha:** 2026-11-26
- **Decisores:** Fabián Gallego (Product Owner técnico), equipo AgroConnect
- **Relacionado:** ADR-004 (React + Vite SPA), ADR-007 (Leaflet + OpenStreetMap),
  ADR-017 (descomposición de `PropertyMap`), ADR-019 (marketplace API propia),
  ADR-022 (marketplace vitrina), ADR-023 (moderación previa)

## Contexto

Al cierre del sprint 2026-10-28 el frontend funcionaba, pero con tres deudas
estructurales:

1. La navegación era una unión `View` con `setView`: no había URLs por pantalla,
   atrás/adelante ni enlaces profundos; los tokens de correo se leían de
   `window.location.search`.
2. Cada pantalla llamaba a los servicios (`productsApi`, `profileApi`,
   `apiClient`) y guardaba su propio estado remoto, sin caché ni invalidación
   compartida. Aprobar un producto en moderación no actualizaba el catálogo.
3. Solo existían cinco piezas de UI (`ErrorBoundary`, `ImageGallery`,
   `ImageUpload`, `PropertyDetailModal`, `SafeImage`) sin contrato común de
   variantes, foco o touch targets. `MarketplacePrototype.tsx` concentraba 835
   líneas y `PropertyMap` ya se había descompuesto en ADR-017.

El plan `docs/plan-fase-3-frontend.md` definió cuatro decisiones (D1–D4) y cinco
incrementos. Este ADR registra las decisiones y su evidencia al cerrar F1–F4.

## Decisión

### D1 — React Router 7 en modo datos, con rutas `lazy`

Se usa `react-router@7` con `createBrowserRouter` + `RouterProvider`, rutas
anidadas y `lazy` por pantalla. Las guardas son wrappers de ruta:
`RequireAuth`, `RequireRole(['administrador'])` y `PublicOnly`. El árbol de
rutas vive en `src/app/routes.tsx` y las pantallas se resuelven en
`src/app/screenRoutes.tsx`.

**Alternativa descartada:** `wouter`. Obligaba a construir a mano rutas
anidadas, errores por ruta y code-splitting.

### D2 — TanStack Query v5 como única capa de datos remotos

`QueryClientProvider` es único (`src/app/providers.tsx`). Los `loader` del
router **no** consultan la API: toda lectura pasa por hooks con claves
centralizadas (`src/shared/api/queryKeys.ts`). Los reintentos solo aplican a
errores de red (`ApiError.status === 0`, máximo 2); las mutaciones no reintentan.
El logout, el modo demo y la sesión expirada ejecutan `queryClient.clear()` para
no filtrar datos entre cuentas.

**Alternativa descartada:** loaders del router. Habría creado dos cachés
compitiendo y dos políticas de reintento/invalidación.

### D3 — `src/shared/ui` con tokens Tailwind 4

Los primitivos (`Button`, `Input`, `Field`, `Card`, `Badge`, `Alert`, `Modal`,
`Skeleton`, `EmptyState`, `ErrorState`, `Pagination`, `Toast`) usan los tokens
`@theme` de `src/index.css` (verde `#2E7D32`, amarillo `#F9A825`), foco visible,
targets mínimos de 48×48 px y `aria-*` en formularios. No se añadió una
librería de componentes.

**Alternativa descartada:** librería externa de componentes. Impondría otro
lenguaje visual y otro presupuesto de bundle sobre un design system ya definido
en `SPEC.md` §3.

### D4 — Mapa de URLs estable y compatibilidad de tokens

Las rutas públicas, autenticadas y por rol quedan estables. Los enlaces
heredados `/?resetToken=...` y `/?verifyToken=...` se redirigen a
`/reset?token=...` y `/verificar?token=...`; el token se lee una sola vez y se
borra del historial. `returnTo` se valida con `safeReturnTo` (origen interno,
sin backslashes ni valores codificados).

**Alternativa descartada:** mantener el `View` switch durante la migración.
Los enlaces de correo habrían quedado rotos y no se ganaba nada en riesgo.

## Implementación y evidencia

| Incremento | Alcance | Commit |
| --- | --- | --- |
| F1 | Router 7, rutas `lazy`, guardas, deep links, `returnTo` seguro | `6e93652` (hardening `4f5e8f9`) |
| F2 | TanStack Query, claves, hooks, mutaciones e invalidación, limpieza de caché | `5c41fea` |
| F3 | `src/shared/ui`, migración de autenticación, RTL + axe y gate Playwright | `7b00dbc` |
| F4 | División de `MarketplacePrototype` en `src/features/marketplace/components` | `f446c5d` |

Mapa de rutas vigente:

| Ruta | Pantalla | Acceso |
| --- | --- | --- |
| `/` | `WelcomeScreen` | Público |
| `/roles` | `RoleSelectionScreen` | Público |
| `/registro` | `RegisterScreen` | Público |
| `/login` | `LoginScreen` | Público (redirige si hay sesión) |
| `/recuperar` | `ForgotPasswordScreen` | Público |
| `/reset` | `ResetPasswordScreen` (`?token=`) | Público |
| `/verificar` | `VerifyEmailScreen` (`?token=`) | Público |
| `/panel` | `DashboardScreen` | Autenticado |
| `/perfil` | `ProfileScreen` | Autenticado |
| `/publicar` | `PublishProductScreen` | `productor` |
| `/moderacion` | `ModerationScreen` | `administrador` |
| `/marketplace` | `MarketplacePrototype` (lazy) | Público |
| `*` | `NotFoundScreen` | Público |

Gates al cierre de F4 (26/11/2026):

- `tsc --noEmit` y ESLint con `--max-warnings 0`: cero errores.
- Frontend: **119/119** pruebas unitarias en 19 archivos.
- E2E Playwright: **16/16** (`/tmp/opencode/e2e-f4.log`), incluidos marketplace,
  detalle, publicación, demo y axe en `/login`, `/registro`, `/marketplace` y
  `/moderacion`.
- Bundle inicial medido desde `dist/index.html`: **162,8 KB gzip** (límite
  200 KB de `SPEC.md` §10).
- Sin violaciones axe WCAG 2.1 A/AA en las cuatro rutas del gate.

## Consecuencias

**Positivas**

- Cada pantalla tiene URL recargable y enlaces compartibles; atrás/adelante
  funciona y los enlaces de correo sobreviven a la migración.
- Una sola caché de servidor: aprobar/rechazar invalida pendientes y catálogo;
  no hay datos de una cuenta visibles en otra.
- El marketplace quedó en 136 líneas de composición; los paneles se pueden
  probar y evolucionar por separado.
- Los primitivos compartidos reducen duplicación y hacen exigible el contrato
  de accesibilidad y touch targets.

**Negativas / trade-offs**

- Dos dependencias nuevas (`react-router`, `@tanstack/react-query`) y una
  superficie de API que el equipo debe conocer.
- El bundle inicial queda en 162,8 KB gzip: dentro del presupuesto, pero con
  37,2 KB de margen. Cualquier dependencia nueva debe medirse.
- `MarketplaceShell` conserva estilos de animación en un bloque `<style>` por
  razones de compatibilidad visual; es deuda estética, no funcional.

**Riesgos y mitigación**

- **PWA con respuestas autenticadas:** Workbox solo precachea assets estáticos;
  las rutas `/api/v1/*` no se cachean. Se revisa en cada cambio de `vite.config`.
- **Regresión de navegación:** el E2E cubre deep link protegido, login, panel,
  perfil, marketplace y moderación antes de mergear.
- **Crecimiento del bundle:** se mide en cada incremento; el límite de 200 KB es
  un gate, no una recomendación.
- **LCP de marketplace:** el contenido propio pinta ~2,4 s, pero el tile de
  OpenStreetMap domina el LCP (4,45 s, 82 % en `load delay`). El presupuesto de
  2,5 s no se cumple por un recurso de terceros; se evaluará cargar el mapa tras
  interacción o con placeholder estático.

## Seguimiento

- Cliente OpenAPI tipado: resuelto con ADR-025 (tipos generados y guard de
  contrato en compilación; sin cliente HTTP runtime).
- Medición LCP/TTI en 3G simulada: pendiente de un entorno de medición estable;
  el plan la referenciaba para F1/F4 y aún no se registró un número defendible.
- Migración visual del marketplace a `src/shared/ui`: gradual, sin big-bang;
  F4 priorizó la separación estructural.

## Referencias

- `docs/plan-fase-3-frontend.md` (D1–D4, incrementos y DoD).
- `SPEC.md` §2 (stack), §3 (design system), §10 (performance budget), §12
  (prohibiciones: Leaflet, sin `any`, sin `console.log`).
- `docs/acta-cierre-sprint-2026-10-28.md` §3 y §7.1 (fila F).
