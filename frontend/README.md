# AgroConnect — Frontend

Aplicación web de AgroConnect: **React 19 + Vite 8 + TypeScript 6 + Tailwind CSS 4**, con **React Router 7**, **TanStack Query 5** y **Leaflet + OpenStreetMap** para la capa geoespacial.

## Arranque

```bash
npm install
npm run dev          # http://localhost:5173 (requiere la API en http://localhost:4000)
```

Variables de entorno: copia `.env.example` a `.env.local` y completa:

| Variable | Uso |
|---|---|
| `VITE_API_URL` | URL de la API (default `http://localhost:4000`) |
| `VITE_CLOUDINARY_CLOUD_NAME` | Nube de Cloudinary para resolver imágenes |

Las subidas a Cloudinary se firman en el backend; el frontend nunca recibe el
secreto.

## Comandos

| Comando | Función |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción (`tsc -b && vite build` + service worker) |
| `npm run lint` | ESLint con 0 warnings |
| `npm run test` / `npm run test:unit` | Pruebas unitarias y de componentes (Vitest) |
| `npm run test:e2e` | Playwright (levanta API y web automáticamente) |
| `npm run test:preview` | Smoke del build: sirve `dist/` y verifica `/` y `/marketplace` |
| `npm run quality` | Prettier + ESLint fix |

## Mapa de rutas

| Ruta | Pantalla | Acceso |
|---|---|---|
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

Los enlaces heredados `/?resetToken=...` y `/?verifyToken=...` se redirigen a
`/reset?token=...` y `/verificar?token=...`; el token se borra del historial.
`returnTo` se valida con `safeReturnTo` (origen interno).

## Estructura

```
src/
├── app/                     # Router, guardas, providers y resolución lazy de pantallas
├── auth/                    # Módulo de acceso (M02): API, contexto, esquemas y pantallas
├── components/              # Mapa Leaflet, galería, upload, modal y ErrorBoundary
├── features/marketplace/    # Shell, filtros, mapa, resultados, distribución y pie
├── services/                # apiClient, productos, perfil, parcelas y Cloudinary
├── shared/
│   ├── api/                 # QueryClient, queryKeys y hooks TanStack Query
│   └── ui/                  # Button, Input, Field, Card, Badge, Alert, Modal, Toast…
├── data/                    # Catálogo mock para el modo demo
├── types/                   # Tipos de dominio del frontend
└── MarketplacePrototype.tsx # Composición del marketplace (estado de selección)
```

### Capa de datos

- `QueryClientProvider` único en `src/app/providers.tsx`.
- Claves centralizadas en `src/shared/api/queryKeys.ts`.
- `useProducts`, `usePendingProducts`, `useProfile`, `usePlots` y
  `useNearbyPlots`; mutaciones con invalidación de catálogo/pendientes.
- Reintentos solo para errores de red (`ApiError.status === 0`, máximo 2).
- Logout, demo-logout y sesión expirada ejecutan `queryClient.clear()`.

## Pruebas

```bash
npm run test                         # Vitest (unitarias + RTL)
npm run test:e2e                     # Playwright
npm run test:e2e -- e2e/a11y.spec.ts # Gate axe WCAG 2.1 A/AA
npm run test:preview                 # Smoke del build de producción
```

Los E2E viven en `e2e/` y usan `webServer` (API en `4100`, web en `5173`).
Requieren la base `agroconnect_test` migrada; `global-setup.ts` siembra productos
demo y el administrador E2E de forma idempotente. El gate axe cubre `/login`,
`/registro`, `/marketplace` y `/moderacion`.

## Design system

- Verde `#2E7D32` · Amarillo `#F9A825` · Verde oscuro `#1B5E20`.
- Tipografías Inter (UI) + Merriweather (contenido).
- Touch targets ≥ 48×48 px · Contraste WCAG AA · foco visible.
- Tokens en `src/index.css` (`@theme` de Tailwind 4); primitivos en
  `src/shared/ui`.

## Presupuesto

Bundle inicial medido tras el hardening de producción (26/11/2026): **109,4 KB gzip** desde
`dist/index.html`, por debajo del límite de 200 KB de `SPEC.md` §10. Cualquier
dependencia nueva debe medirse antes de mergear.

## Decisiones relacionadas

- `docs/adr/0024-fase-3-router-datos-ui.md` (router, datos, UI y URLs).
- `docs/adr/0017-property-map-decomposition.md` (mapa).
- `docs/adr/0022-marketplace-vitrina.md`, `docs/adr/0023-moderacion-previa-productos.md`.
