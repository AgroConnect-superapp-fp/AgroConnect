# Plan Fase 3 — Router, capa de datos y sistema de componentes

**Fecha:** 17 de noviembre de 2026
**Estado:** F1–F5 completadas (26/11/2026); fase 3 cerrada
**Referencias:** acta de cierre del sprint 2026-10-28 §3 (fila 3), `SPEC.md` §10 (performance budget rural-first), ADR-022 y ADR-023.

---

## 1. Diagnóstico verificado

| Elemento | Estado real (verificado en el código) |
| --- | --- |
| Navegación | `frontend/src/App.tsx` mantiene una unión `View` de 12 vistas y cambia con `setView`. No hay URLs por pantalla: atrás/adelante, recarga y enlaces profundos no funcionan. |
| Tokens de correo | `resetToken` y `verifyToken` se leen de `window.location.search` al arrancar y deciden la vista inicial; no son rutas. |
| Router | No hay `react-router` ni equivalente en `frontend/package.json`. |
| Datos remotos | Cada pantalla llama a los servicios (`productsApi`, `profileApi`, `apiClient`) con estado local; no hay caché compartida ni invalidación. |
| Sistema de componentes | `frontend/src/components/ui` tiene 5 piezas (ErrorBoundary, ImageGallery, ImageUpload, PropertyDetailModal, SafeImage) sin contrato común de variantes. |
| Mapas | `frontend/src/components/maps` ya está descompuesto (PropertyMap + Canvas + Sidebar + Toolbar + controles). |
| Layout | `frontend/src/components/layout` está vacío. |
| Shell | `frontend/src/MarketplacePrototype.tsx` concentra 825 líneas (shell, estado y datos). |
| Stack | React 19.3, Vite 8, Tailwind CSS 4 (`@theme` en `index.css`), react-leaflet 5, Vitest y Playwright, PWA con `vite-plugin-pwa` + Workbox. |
| Presupuesto | Bundle inicial < 200 KB gzip, TTI < 3,5 s en 3G, LCP < 2,5 s (`SPEC.md` §10). |

**Consecuencia:** la fase 3 no es solo “instalar un router”; es separar navegación, datos y presentación para que las pantallas dejen de duplicar estado de servidor y para que el marketplace pueda dividirse sin romper el presupuesto de rendimiento.

---

## 2. Objetivo y criterio de aceptación global

- **Objetivo:** cada pantalla tiene URL propia y recargable; los datos remotos pasan por una sola capa con caché e invalidación; los componentes base viven en `src/shared/ui` con accesibilidad y touch targets de 48 px.
- **Criterio de aceptación global (Gherkin):**

```gherkin
Dado que abro /moderacion sin sesión
Cuando la aplicación termina de cargar
Entonces soy redirigido a /login con returnTo=/moderacion
Y tras autenticarme como administrador vuelvo a /moderacion

Dado que apruebo un producto en /moderacion
Cuando la mutación responde 200
Entonces la cola pendiente se invalida y desaparece el producto aprobado
Y el catálogo de /marketplace lo muestra sin recargar la página

Dado el bundle de producción
Cuando ejecuto la medición de tamaño
Entonces el bundle inicial gzip se mantiene por debajo de 200 KB
```

---

## 3. Decisiones propuestas

| # | Decisión | Alternativa descartada | Motivo |
| --- | --- | --- | --- |
| D1 | **React Router 7 en modo datos** (`createBrowserRouter` + `RouterProvider`) con rutas `lazy` por pantalla. | `wouter` | Necesitamos rutas anidadas, errores por ruta y `lazy` con code-splitting; wouter obliga a construir eso a mano. |
| D2 | **TanStack Query v5** como única capa de datos remotos. Los `loader` del router no consultan la API. | Loaders del router | Evita dos cachés compitiendo y mantiene una sola política de reintentos e invalidación. |
| D3 | **`src/shared/ui` con tokens Tailwind 4** y variantes explícitas (sin dependencia nueva de estilos). | Librería de componentes externa | El design system ya está definido en `@theme` (verde `#2E7D32`, amarillo `#F9A825`); una librería impondría otro lenguaje visual. |
| D4 | **Mapa de URLs estable** + redirección de compatibilidad desde `?resetToken`/`?verifyToken`. | Mantener el `View` switch | Los enlaces de correo deben seguir funcionando durante la migración. |

### Mapa de rutas propuesto

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

Guardas como wrappers de ruta: `RequireAuth` y `RequireRole(['administrador'])`, con `returnTo` en el estado de navegación.

---

## 4. Incrementos y Definition of Done

### F1 — Router y URLs (estimación: 2–3 días)

> **Estado: COMPLETADA (24/11/2026 · `6e93652`).** Implementada en `src/app/`
> (el árbol de rutas quedó en `screenRoutes.tsx`): rutas `lazy`, guardas de
> sesión/rol, `returnTo` seguro y compatibilidad con `?resetToken=` y
> `?verifyToken=`. Evidencia: 25 pruebas nuevas, suite frontend 17 archivos/78
> tests, `tsc` y ESLint en cero, E2E 14/14 y bundle inicial medido en ~129,5 KB
> gzip (presupuesto 200 KB). LCP/TTI en 3G se miden en F4, con el shell dividido.

- Instalar `react-router@7`; crear `src/app/router.tsx`, `src/app/guards.tsx` y `src/app/screenRoutes.tsx`.
- Convertir `App.tsx` en `RouterProvider` + `AuthProvider`; eliminar la unión `View`.
- Rutas `lazy` para todas las pantallas (hoy solo el marketplace lo es).
- Redirección de compatibilidad: `/?resetToken=...` → `/reset?token=...`; `/?verifyToken=...` → `/verificar?token=...`.
- **DoD:** `npx tsc -b frontend`, `npm run lint -w agroconnect-frontend`, `npm test -w agroconnect-frontend`; E2E Playwright de navegación (login → panel → perfil → atrás) y de deep link protegido; presupuesto de bundle medido.

### F2 — Capa de datos con TanStack Query (estimación: 3–4 días)

- `QueryClientProvider` único en `src/app/providers.tsx`; `staleTime` 30 s en catálogo, 0 en moderación; reintentos solo en errores de red.
- Hooks por recurso: `useProducts`, `usePendingProducts`, `useProfile`, `usePlots`, con claves de query centralizadas (`src/shared/api/queryKeys.ts`).
- Mutaciones con invalidación: aprobar/rechazar invalida `pending` y `products`; publicar invalida `products` y `pending`.
- Estados de carga/error con `Skeleton`, `EmptyState` y `ErrorState` (de F3).
- **DoD:** tests de hooks con `apiClient` mockeado; sin cambios en `packages/contracts`; `npm test` y E2E de moderación en verde.
- **Evidencia (25/11/2026):** cerrada en `5c41fea`. `QueryClientProvider` en `src/app/providers.tsx`; claves en `src/shared/api/queryKeys.ts`; hooks y mutaciones en `src/shared/api/hooks`; `plotsApi` con la distancia calculada por PostGIS. El logout y la sesión expirada vacían la caché. Gates: `tsc` y ESLint en cero, **103/103** unitarias (incluye 7 de hooks y 2 de limpieza de caché), build correcto (~109 KB gzip inicial) y E2E **14/14**.

### F3 — Sistema de componentes `src/shared/ui` (estimación: 3–5 días)

- Componentes: `Button` (primary/secondary/ghost/danger, mínimo 48×48 px), `Input`, `Field`, `Card`, `Badge`, `Alert`, `Modal`/`Sheet`, `Skeleton`, `EmptyState`, `ErrorState`, `Pagination`, `Toast`.
- Reglas: foco visible, contraste WCAG AA, `aria-*` en formularios, textos en español, sin `any`.
- Migración incremental: primero pantallas de autenticación, después marketplace.
- **DoD:** pruebas RTL por componente + `axe-core` sin violaciones; Playwright con `@axe-core/playwright` en `/login`, `/registro`, `/marketplace` y `/moderacion`.
- **Evidencia (26/11/2026):** cerrada en `7b00dbc`. `frontend/src/shared/ui` exporta `Button`, `Input`, `Field`, `Card`, `Badge`, `Alert`, `Modal`, `Skeleton`, `EmptyState`, `ErrorState`, `Pagination`, `Toast`/`ToastProvider`/`useToast`; `auth/components/Button.tsx` y `FormField.tsx` componen los primitivos compartidos sin cambiar su API. Se añadió `@testing-library/jest-dom` con setup global y `axe-core` para RTL (16 pruebas de UI). El gate Playwright amplió `e2e/a11y.spec.ts` a `/login`, `/registro` y `/moderacion`; esta última usa el fixture idempotente `seed:e2e-admin` sobre la base `_test`. Gates: `tsc` y ESLint en cero, **119/119** unitarias, build correcto y E2E **16/16** (`/tmp/opencode/e2e-f3.log`).

### F4 — División del shell del marketplace (estimación: 3–4 días)

- Extraer de `MarketplacePrototype.tsx`: `MarketplaceShell`, `FiltersPanel`, `ResultsList`, `MapPanel` y los hooks de datos de F2.
- Mantener Leaflet + OpenStreetMap y la regla de no calcular distancias en JS.
- **DoD:** E2E de búsqueda geoespacial y detalle de producto; bundle inicial bajo presupuesto; sin regresiones visuales en las rutas clave.
- **Evidencia (26/11/2026):** cerrada en `f446c5d`. `MarketplacePrototype.tsx` pasó de 835 a 136 líneas y ahora solo compone el estado de selección/overrides con `useProducts` y TanStack Query. Se extrajeron `MarketplaceShell`, `FiltersPanel`, `MapPanel`, `ResultsList`, `CropDistribution` y `MarketplaceFooter` a `frontend/src/features/marketplace/components`; Leaflet + OpenStreetMap se mantienen y las distancias siguen calculándose en PostGIS. Gates: `tsc` y ESLint en cero, **119/119** unitarias, build correcto con bundle inicial **181,2 KB gzip** (límite 200 KB) y E2E **16/16** (`/tmp/opencode/e2e-f4.log`).

### F5 — Cierre y documentación (estimación: 1–2 días)

- ADR con D1–D4, README del frontend con el mapa de rutas, actualización del acta (§3, fila 3).
- **DoD:** todos los gates del proyecto en verde y evidencia adjunta al acta.
- **Evidencia (26/11/2026):** cerrada. `docs/adr/0024-fase-3-router-datos-ui.md` registra D1–D4, alternativas, consecuencias y seguimiento; `docs/adr/README.md` la indexa. `frontend/README.md` documenta el stack real (Tailwind 4, React Router 7, TanStack Query 5), el mapa de rutas, la estructura, la capa de datos y el gate axe. El acta sube a v1.8 y marca la fase 3 como cerrada con seguimiento (cliente OpenAPI tipado y medición LCP/TTI). Gates finales: `tsc` y ESLint en cero, **119/119** unitarias, E2E **16/16**, axe sin violaciones en `/login`, `/registro`, `/marketplace` y `/moderacion`, build con **181,2 KB gzip** inicial.

---

## 5. Métricas y presupuesto

| Métrica | Línea base | Objetivo |
| --- | --- | --- |
| Bundle inicial gzip | Medir antes de F1 con `du` sobre `dist/assets` + gzip | < 200 KB |
| LCP en 3G simulada | Medir en F1 | < 2,5 s |
| TTI en 3G simulada | Medir en F1 | < 3,5 s |
| Violaciones axe en rutas clave | 0 en F3 | 0 |

La medición se registra en el acta al cerrar F1 y F4; no se optimiza nada sin número previo.

---

## 6. Riesgos y mitigación

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Regresiones de navegación | Alto | E2E por ruta antes de eliminar el `View` switch; mantear el switch detrás de un flag temporal hasta cerrar F1. |
| Doble caché (router + query) | Medio | D2: los loaders no consultan la API. |
| PWA sirviendo respuestas autenticadas cacheadas | Alto (privacidad) | Revisar `vite-plugin-pwa`/Workbox: nunca cachear `/api/v1/*` autenticado; solo assets estáticos. |
| Deuda de estilos al migrar | Medio | Migración por pantalla, sin big-bang; cada PR con capturas de evidencia. |
| Router y `lazy` rompen el presupuesto | Medio | Medición en F1 y F4; `lazy` por ruta y precarga solo de la ruta inicial. |

---

## 7. Dependencias nuevas

- `react-router` (v7).
- `@tanstack/react-query` (v5).
- `@tanstack/react-query-devtools` (solo desarrollo).
- `@axe-core/react` o `jest-axe` para pruebas de accesibilidad por componente (evaluar en F3).

Ninguna reemplaza las dependencias actuales; Leaflet, Cloudinary, Zod y los contratos se mantienen.

---

## 8. Estimación total

**12–18 días de desarrollo** distribuidas en F1–F5, con entregas semanales y gates por incremento. Cada incremento se puede detener sin dejar el frontend roto, porque la migración es por pantalla y no big-bang.

---

## 9. Trazabilidad

- Acta de cierre §3 (fase 3 pendiente): este plan es su alcance.
- `SPEC.md` §2 (stack), §3 (design system), §10 (performance budget), §12 (prohibiciones: Leaflet, sin `any`, sin `console.log`).
- ADR-022/023 (moderación y vitrina) para las invalidaciones de F2.
- RNF de accesibilidad (WCAG AA) y rendimiento rural-first.
