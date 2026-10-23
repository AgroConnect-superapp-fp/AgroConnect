# ADR-0001: Estrategia de imágenes externas (fallback por cultivo y créditos)

- **Estado**: Aceptada
- **Fecha**: 2026-10-04
- **Decisores**: Equipo AgroConnect
- **Relacionado**: PR #1 (`fix/resolve-direct-image-urls`), datos semilla de `properties`

## Contexto y problema

El prototipo del mercado (mapa + productores destacados) mostraba imágenes almacenadas en la tabla `properties` de Supabase. Se detectaron:

- 6 URLs rotas (HTTP 404) que dejaban tarjetas sin imagen.
- 4 imágenes que no correspondían al cultivo (ej. un banano para una finca de cacao).
- Falta de respaldo cuando una imagen externa falla.
- Falta de atribución de licencias (CC BY-SA de Wikimedia Commons).

Las imágenes provienen de proveedores externos (Unsplash, Wikimedia Commons) y de Cloudinary para las cargas de usuario.

## Decisión

1. **Curar los datos** de `properties` con URLs verificadas (una sola vez), vía `scripts/fix-property-images.sql`.
2. **Fallback por cultivo en el cliente**: `SafeImage` reemplaza automáticamente una imagen rota por `fallbackImages[crop]` (verificada 200 y revisada visualmente).
3. **LQIP por proveedor**: Unsplash (`w=50&q=10&blur=40`), Wikimedia (`width=50`), Cloudinary (transformación en path `w_50,q_10,f_auto`).
4. **Créditos por imagen**: la galería muestra autor · licencia con enlaces a la fuente (`imageCredits.ts`).
5. **Caché en el Service Worker**: imágenes de Cloudinary/Wikimedia/Unsplash con Stale-While-Revalidate (enfoque rural-first).

## Alternativas consideradas

- **Proxy de imágenes propio**: control total y ocultaría al proveedor, pero añade infraestructura, coste y latencia; sobredimensionado para el alcance formativo.
- **Placeholder genérico ante fallos**: simple, pero no comunica el cultivo y resta valor demostrativo.
- **Re-subir todas las imágenes a Cloudinary**: consistente y con transformaciones nativas, pero la cuenta demo no contiene fotos de todos los cultivos y exige gestión de assets.

## Consecuencias

- **Positivas**: UI resiliente ante URLs rotas; imágenes coherentes con cada cultivo; cumplimiento de licencias CC BY-SA; menor consumo de red gracias a LQIP y SWR.
- **Negativas**: dependencia de hotlink a proveedores externos y de sus parámetros de transformación; el catálogo de fallbacks y créditos debe mantenerse al añadir imágenes nuevas.
- **Mitigaciones**: `SafeImage` degrada con gracia; créditos enlazan a la fuente original; si Supabase cae, el marketplace muestra datos de demostración con aviso.

## Referencias

- `frontend/src/components/ui/SafeImage.tsx`
- `frontend/src/data/fallbackImages.ts`, `imageCredits.ts`, `wikimediaImage.ts`
- `frontend/public/sw.js` (estrategia SWR para imágenes externas)
- `scripts/fix-property-images.sql` y `docs/evidencias/sql/fix-property-images.sql`
