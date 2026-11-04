# ADR-021 — Subida firmada a Cloudinary y edición de imágenes por propietario

- **Estado:** Aceptada — implementada
- **Fecha:** 2026-11-04
- **Decisores:** Fabián (arquitectura), equipo AgroConnect
- **Relacionado:** ADR-003 (Cloudinary), ADR-019 (marketplace API propia), ADR-020 (perfiles)

## Contexto

El marketplace subía imágenes desde el navegador con un preset unsigned de
Cloudinary. Eso permitía publicar archivos sin control del servidor y dejaba
sin resolver la persistencia de las imágenes subidas desde el modal de detalle:
se perdían al recargar. Además, cualquier usuario autenticado podía intentar
editar un producto ajeno si existiera un endpoint de escritura.

## Decisión

1. **Firma server-side:** `POST /api/v1/uploads/signature` exige
   `SessionAuthGuard` y rol productor/administrador. El backend emite
   `timestamp`, `folder` por usuario, `allowed_formats` y firma SHA-1 con
   `CLOUDINARY_API_SECRET`. El secreto nunca viaja al frontend.
2. **Subida directa:** el navegador envía archivo, `api_key`, `timestamp`,
   `signature`, `folder` y `allowed_formats` a Cloudinary. El servidor no
   proxya binarios (menor carga y latencia).
3. **Persistencia:** `PATCH /api/v1/products/:id` reemplaza hasta 6 imágenes.
   El caso de uso verifica rol, existencia y `producerId` de la sesión (BOLA);
   el administrador puede moderar. El modal actualiza la galería y la lista.
4. **Degradación:** sin credenciales Cloudinary, la firma responde 503 con
   mensaje claro; no se cae a un preset unsigned en producción.

## Alternativas consideradas

- **Mantener preset unsigned:** simple, pero permite subidas no autorizadas y
  no permite asignar carpeta por usuario. Rechazada.
- **Proxy de archivos por la API:** control total, pero consume ancho de banda,
  memoria y tiempo de Render free; además duplica la CDN. Rechazada.
- **Subida firmada desde el backend con SDK:** requeriría mover el binario al
  servidor; mismo problema que el proxy. Rechazada.

## Consecuencias

- Positivas: el secreto queda protegido, la carpeta se aísla por usuario, la
  subida es trazable y las imágenes del modal persisten.
- Negativas: se deben configurar tres variables `CLOUDINARY_*` juntas; el
  endpoint de firma añade una llamada antes de subir (coste mínimo).
- Pendiente: flujo administrativo de moderación (`moderationStatus`) y política
  de aprobación/rechazo; no se implementa sin decisión de producto.
